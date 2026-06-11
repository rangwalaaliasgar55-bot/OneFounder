import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { db } from '../db'
import { chatMessages } from '../db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { getAIProvider } from '../ai'
import { v4 as uuidv4 } from 'uuid'
import { extractAndStoreMemories } from '../ai/memory'
import { logActivity } from '../ai/activity'

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

router.post('/chat', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { message, sessionId, mode } = req.body

  if (!message?.trim()) return res.status(400).json({ error: 'Message required' })
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
    const response = await ai.chat(messages)

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

  const forbidden = [
    /import\s+os/i, /import\s+subprocess/i, /import\s+sys/i,
    /open\s*\(/i, /__import__/i, /exec\s*\(/i, /eval\s*\(/i,
    /compile\s*\(/i, /globals\s*\(/i, /locals\s*\(/i,
  ]
  for (const pattern of forbidden) {
    if (pattern.test(code)) {
      return res.status(400).json({
        error: 'Unsafe code detected. System access, file I/O, and eval are not allowed.',
        output: null,
      })
    }
  }

  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const execAsync = promisify(exec)

  const safeCode = `
import sys
import io
import contextlib

_output = io.StringIO()
try:
    with contextlib.redirect_stdout(_output):
        exec(compile("""${code.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}""", '<sandbox>', 'exec'))
    print(_output.getvalue(), end='')
except Exception as e:
    print(f'Error: {type(e).__name__}: {e}', file=sys.stderr)
`

  try {
    const { stdout, stderr } = await execAsync(`python3 -c "${safeCode.replace(/"/g, '\\"')}"`, {
      timeout: 10000,
      maxBuffer: 1024 * 256,
    })
    res.json({ output: stdout || '', error: stderr || null })
  } catch (err: any) {
    res.json({
      output: err.stdout || '',
      error: err.stderr || err.message || 'Execution failed',
    })
  }
})

export default router
