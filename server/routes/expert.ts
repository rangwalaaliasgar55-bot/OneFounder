import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { checkTokens, deductToken } from '../middleware/tokens.js'
import { validate } from '../middleware/validate.js'
import { ExpertChatSchema, ExpertCodeReviewSchema } from '../middleware/schemas.js'
import { db } from '../db/index.js'
import { chatMessages } from '../db/schema.js'
import { eq, desc, and } from 'drizzle-orm'
import { getAIProvider } from '../ai/index.js'
import { v4 as uuidv4 } from 'uuid'
import { extractAndStoreMemories } from '../ai/memory.js'
import { logActivity } from '../ai/activity.js'

const router = Router()

export const EXPERT_MODES: Record<string, { icon: string; name: string; systemPrompt: string }> = {
  code: {
    icon: '💻',
    name: 'Code Expert',
    systemPrompt: `You are a Senior Software Engineer and Code Expert with mastery of all programming languages.
Your capabilities:
- Debug any code, identify root causes, and provide exact fixes
- Explain code step-by-step with clear, beginner-friendly language
- Refactor and optimize for performance, readability, and best practices
- Suggest architecture improvements and design patterns
- Write production-quality code with proper error handling

Format rules:
- Always wrap code in triple backtick code blocks with the language name (e.g. \`\`\`python)
- Explain what changed and WHY after every code snippet
- Be direct and specific — no generic advice`,
  },
  python: {
    icon: '🐍',
    name: 'Python Expert',
    systemPrompt: `You are a Python Expert covering all levels from beginner to advanced.
Your capabilities:
- Teach Python concepts step-by-step with working examples
- Debug Python scripts and explain errors clearly
- Help with data science, automation, web scraping, and APIs
- Optimize Python code for speed and memory
- Cover libraries: pandas, numpy, requests, FastAPI, Flask, SQLAlchemy, etc.

Format rules:
- Always use \`\`\`python code blocks
- Show input/output examples for every script
- Explain errors line-by-line when debugging`,
  },
  seo: {
    icon: '📈',
    name: 'SEO Expert',
    systemPrompt: `You are an SEO Expert specializing in technical SEO, content strategy, and ranking.
Your capabilities:
- Keyword research strategy and clustering
- On-page and technical SEO audits
- Content briefs and blog optimization
- Backlink strategy and competitor gap analysis
- Core Web Vitals and page speed optimization
- Local SEO, schema markup, and structured data

Format rules:
- Use bullet points for action items
- Prioritize recommendations by impact (High / Medium / Low)
- Always provide specific examples, not generic advice`,
  },
  data: {
    icon: '📊',
    name: 'Data Analyst',
    systemPrompt: `You are a Data Analyst and Business Intelligence expert.
Your capabilities:
- Write and optimize SQL queries for any database
- Analyze data patterns and generate business insights
- Suggest chart types and data visualizations
- Data cleaning and transformation strategies
- KPI frameworks and metric definitions
- Statistical analysis and A/B testing guidance

Format rules:
- Wrap SQL in \`\`\`sql code blocks
- Show example output tables where relevant
- Always explain the business meaning behind numbers`,
  },
  security: {
    icon: '🔐',
    name: 'Cybersecurity Analyst',
    systemPrompt: `You are a Cybersecurity Analyst specializing in secure coding and vulnerability detection.
Your capabilities:
- Detect insecure code patterns (SQL injection, XSS, CSRF, etc.)
- Review API security and authentication flows
- Explain OWASP Top 10 vulnerabilities with examples
- Suggest secure coding patterns and fixes
- Threat modeling for web applications
- Secrets management and environment security

Format rules:
- Rate severity: 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low
- Always show the vulnerable code then the secure version
- Explain WHY something is a vulnerability`,
  },
  product: {
    icon: '📦',
    name: 'Product Manager',
    systemPrompt: `You are a Senior Product Manager with expertise in SaaS and startup products.
Your capabilities:
- Feature prioritization using MoSCoW, RICE, or ICE frameworks
- Product roadmap planning and sprint structuring
- User story and acceptance criteria writing
- UX review and improvement suggestions
- Go-to-market strategy and launch planning
- Competitive analysis and positioning

Format rules:
- Use structured tables for prioritization
- Write user stories in "As a [user], I want [goal], so that [reason]" format
- Always connect features to business outcomes`,
  },
}

router.get('/modes', (req, res) => {
  const modes = Object.entries(EXPERT_MODES).map(([id, m]) => ({
    id,
    icon: m.icon,
    name: m.name,
  }))
  res.json(modes)
})

router.post('/chat', requireAuth, checkTokens, validate(ExpertChatSchema), async (req, res) => {
  const user = (req as any).user
  const { message, sessionId, mode } = req.body
  if (!mode || !EXPERT_MODES[mode]) return res.status(400).json({ error: 'Invalid expert mode' })

  const session = sessionId || uuidv4()
  const expert = EXPERT_MODES[mode]

  await db.insert(chatMessages).values({
    userId: user.id,
    sessionId: session,
    role: 'user',
    content: message,
    model: `expert:${mode}`,
  })

  await logActivity(user.id, 'expert_chat', mode, session, { mode })

  // Deduct token BEFORE the AI call
  if (!user.isAdmin) {
    const deducted = await deductToken(user.id)
    if (!deducted) return res.status(429).json({ error: 'Insufficient tokens', code: 'NO_TOKENS' })
  }

  const history = await db.select().from(chatMessages)
    .where(and(
      eq(chatMessages.userId, user.id),
      eq(chatMessages.sessionId, session)
    ))
    .orderBy(chatMessages.createdAt)

  const messages = [
    { role: 'system' as const, content: expert.systemPrompt },
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
  ]

  try {
    const ai = await getAIProvider()
    const chatResponse = await ai.chat(messages)
    const response = chatResponse.content

    const [saved] = await db.insert(chatMessages).values({
      userId: user.id,
      sessionId: session,
      role: 'assistant',
      content: response,
      model: `expert:${mode}`,
    }).returning()

    extractAndStoreMemories(user.id, message, response, `expert:${mode}`).catch(() => {})

    res.json({ message: saved, sessionId: session })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'AI request failed' })
  }
})

router.post('/python/run', requireAuth, async (req, res) => {
  const { code } = req.body
  if (!code?.trim()) return res.status(400).json({ error: 'No code provided' })
  if (typeof code !== 'string' || code.length > 5000) {
    return res.status(400).json({ error: 'Code too long (max 5000 chars)' })
  }

  // Strict blocklist — covers common sandbox-escape vectors
  const forbidden: Array<{ pattern: RegExp; reason: string }> = [
    { pattern: /\bimport\s+os\b/i, reason: 'os module not allowed' },
    { pattern: /\bimport\s+subprocess\b/i, reason: 'subprocess not allowed' },
    { pattern: /\bimport\s+sys\b/i, reason: 'sys module not allowed' },
    { pattern: /\bimport\s+socket\b/i, reason: 'socket not allowed' },
    { pattern: /\bimport\s+shutil\b/i, reason: 'shutil not allowed' },
    { pattern: /\bimport\s+pathlib\b/i, reason: 'pathlib not allowed' },
    { pattern: /\bimport\s+ctypes\b/i, reason: 'ctypes not allowed' },
    { pattern: /\bimport\s+importlib\b/i, reason: 'importlib not allowed' },
    { pattern: /\bopen\s*\(/i, reason: 'file I/O not allowed' },
    { pattern: /\b__import__\s*\(/i, reason: '__import__ not allowed' },
    { pattern: /\bexec\s*\(/i, reason: 'exec() not allowed' },
    { pattern: /\beval\s*\(/i, reason: 'eval() not allowed' },
    { pattern: /\bcompile\s*\(/i, reason: 'compile() not allowed' },
    { pattern: /\bglobals\s*\(\s*\)/i, reason: 'globals() not allowed' },
    { pattern: /\blocals\s*\(\s*\)/i, reason: 'locals() not allowed' },
    { pattern: /\bgetattr\s*\(/i, reason: 'getattr() not allowed' },
    { pattern: /\bsetattr\s*\(/i, reason: 'setattr() not allowed' },
    { pattern: /\b__builtins__\b/i, reason: '__builtins__ not allowed' },
    { pattern: /\b__class__\b/i, reason: '__class__ access not allowed' },
    { pattern: /\bmro\s*\(\s*\)/i, reason: 'mro() not allowed' },
  ]

  for (const { pattern, reason } of forbidden) {
    if (pattern.test(code)) {
      return res.status(400).json({ error: `Unsafe code: ${reason}`, output: null })
    }
  }

  // Python sandbox requires a real OS — not available on Vercel serverless
  if (process.env.VERCEL) {
    return res.status(501).json({
      error: 'Python execution is not available in the deployed environment. Run OneFounder locally to use this feature.',
      output: null,
    })
  }

  const { writeFile, unlink } = await import('fs/promises')
  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const { tmpdir } = await import('os')
  const { join } = await import('path')
  const execAsync = promisify(exec)

  // Write to a temp file (avoids shell-injection via -c flag)
  const tmpFile = join(tmpdir(), `sandbox_${Date.now()}_${Math.random().toString(36).slice(2)}.py`)

  const wrapper = `import sys, io, contextlib, builtins

# Remove dangerous builtins
_safe_builtins = {k: v for k, v in vars(builtins).items()
                  if k not in ('open','__import__','exec','eval','compile','input','breakpoint','memoryview')}
_safe_globals = {'__builtins__': _safe_builtins}

_out = io.StringIO()
_err = io.StringIO()
try:
    with contextlib.redirect_stdout(_out), contextlib.redirect_stderr(_err):
        exec(compile(${JSON.stringify(code)}, '<sandbox>', 'exec'), _safe_globals)
    sys.stdout.write(_out.getvalue())
    if _err.getvalue():
        sys.stderr.write(_err.getvalue())
except Exception as e:
    sys.stderr.write(f'{type(e).__name__}: {e}\\n')
`

  try {
    await writeFile(tmpFile, wrapper, 'utf8')
    const { stdout, stderr } = await execAsync(`python3 ${tmpFile}`, {
      timeout: 8000,
      maxBuffer: 1024 * 128,
      env: { PATH: process.env.PATH || '/usr/bin:/bin' }, // minimal env
    })
    res.json({ output: stdout || '', error: stderr || null })
  } catch (err: any) {
    res.json({
      output: err.stdout || '',
      error: err.stderr || err.message || 'Execution failed',
    })
  } finally {
    unlink(tmpFile).catch(() => {})
  }
})

export default router
