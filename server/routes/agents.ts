import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { checkTokens, deductToken } from '../middleware/tokens.js'
import { executeMultiAgent, type SpecialistType } from '../agents/supervisorAgent.js'
import { storeMemory } from '../memory/memoryManager.js'
import { extractAndStoreMemories } from '../ai/memory.js'

const router = Router()

router.post('/execute', requireAuth, checkTokens, async (req, res) => {
  const user = (req as any).user
  const { query, agents, stream } = req.body

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query is required' })
  }
  if (query.length > 8000) {
    return res.status(400).json({ error: 'Query too long (max 8000 chars)' })
  }

  // Deduct token BEFORE the AI call
  if (!user.isAdmin) {
    const deducted = await deductToken(user.id)
    if (!deducted) return res.status(429).json({ error: 'Insufficient tokens', code: 'NO_TOKENS' })
  }

  try {
    const result = await executeMultiAgent(
      user.id,
      query,
      agents as SpecialistType[] | undefined
    )

    extractAndStoreMemories(user.id, query, result.synthesis, 'multi-agent').catch(() => {})

    res.json({
      synthesis: result.synthesis,
      agentsUsed: result.agentsUsed,
      agentResults: (result.agentResults || []).map(r => ({
        agent: r.agent,
        response: r.response,
        confidence: r.confidence,
        executionTimeMs: r.executionTimeMs,
      })),
      totalTimeMs: result.totalTimeMs,
      memoryUsed: result.memoryUsed,
      ragUsed: result.ragUsed,
    })
  } catch (err: any) {
    console.error('[Multi-Agent Error]', err.message)
    res.status(500).json({ error: err.message || 'Multi-agent execution failed' })
  }
})

router.post('/stream', requireAuth, checkTokens, async (req, res) => {
  const user = (req as any).user
  const { query, agents } = req.body

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query is required' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  const send = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  // Deduct token BEFORE the AI call
  if (!user.isAdmin) {
    const deducted = await deductToken(user.id)
    if (!deducted) {
      send('error', { message: 'Insufficient tokens', code: 'NO_TOKENS' })
      res.end()
      return
    }
  }

  try {
    const { executeMultiAgent } = await import('../agents/supervisorAgent.js')
    const result = await executeMultiAgent(user.id, query, agents)

    send('agents_selected', { agents: result.agentsUsed })

    for (const agentResult of (result.agentResults || [])) {
      send('agent_complete', {
        agent: agentResult.agent,
        executionTimeMs: agentResult.executionTimeMs,
        confidence: agentResult.confidence,
      })
    }

    send('synthesis', { content: result.synthesis })
    send('done', {
      agentsUsed: result.agentsUsed,
      totalTimeMs: result.totalTimeMs,
      memoryUsed: result.memoryUsed,
      ragUsed: result.ragUsed,
    })
  } catch (err: any) {
    send('error', { message: err.message || 'Execution failed' })
  } finally {
    res.end()
  }
})

router.get('/available', requireAuth, (_req, res) => {
  const agents = [
    { id: 'research', icon: '🔬', name: 'Research Agent', desc: 'Market intelligence & competitive analysis', color: 'yellow' },
    { id: 'engineering', icon: '💻', name: 'Engineering Agent', desc: 'Architecture, code review & implementation', color: 'blue' },
    { id: 'marketing', icon: '📣', name: 'Marketing Agent', desc: 'Growth strategy & campaign execution', color: 'rose' },
    { id: 'seo', icon: '🔍', name: 'SEO Command Center', desc: 'Search visibility & content strategy', color: 'green' },
    { id: 'finance', icon: '💰', name: 'Finance Agent', desc: 'Unit economics, fundraising & financial modeling', color: 'emerald' },
    { id: 'sales', icon: '💼', name: 'Sales Agent', desc: 'Pipeline, outbound & deal closing', color: 'cyan' },
    { id: 'security', icon: '🔒', name: 'Security Agent', desc: 'Threat modeling & vulnerability analysis', color: 'red' },
    { id: 'devops', icon: '☁️', name: 'DevOps Agent', desc: 'Infrastructure, CI/CD & reliability', color: 'slate' },
    { id: 'product', icon: '🧩', name: 'Product Agent', desc: 'Roadmap, prioritization & PMF', color: 'pink' },
    { id: 'data', icon: '📊', name: 'Data Agent', desc: 'Analytics, KPIs & business intelligence', color: 'purple' },
    { id: 'legal', icon: '⚖️', name: 'Legal Ops Agent', desc: 'Contracts, compliance & IP protection', color: 'amber' },
    { id: 'startup', icon: '🚀', name: 'Founder Agent', desc: 'Strategy, PMF & fundraising guidance', color: 'orange' },
  ]
  res.json({ agents })
})

export default router
