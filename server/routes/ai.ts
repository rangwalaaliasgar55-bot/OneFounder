import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { checkTokens, deductToken } from '../middleware/tokens.js'
import { getAIProvider, getAIStatus } from '../ai/index.js'
import { OllamaOfflineError } from '../ai/provider.js'
import { getWebContextString } from '../ai/webSearch.js'

const router = Router()

function handleAIError(err: any, res: any) {
  if (err instanceof OllamaOfflineError || err.code === 'OLLAMA_OFFLINE') {
    return res.status(503).json({ error: err.message, code: 'OLLAMA_OFFLINE' })
  }
  res.status(500).json({ error: err.message || 'AI error' })
}

router.get('/status', async (_req, res) => {
  try {
    const status = await getAIStatus()
    res.json(status)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get AI status' })
  }
})

router.get('/tokens', requireAuth, async (req, res) => {
  const user = (req as any).user
  res.json({
    tokenBalance: user.tokenBalance ?? 0,
    tokenUsed: user.tokenUsed ?? 0,
    isAdmin: user.isAdmin ?? false,
  })
})

router.post('/chat', requireAuth, checkTokens, async (req, res) => {
  const user = (req as any).user
  const { messages } = req.body
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Messages array required' })
  if (messages.length > 50) return res.status(400).json({ error: 'Too many messages (max 50)' })

  // Deduct token BEFORE the AI call
  if (!user.isAdmin) {
    const deducted = await deductToken(user.id)
    if (!deducted) return res.status(429).json({ error: 'Insufficient tokens', code: 'NO_TOKENS' })
  }

  try {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const withDate = messages.map((m: any, i: number) =>
      i === 0 && m.role === 'system'
        ? { ...m, content: `Today is ${today}.\n\n${m.content}` }
        : m
    )
    const ai = await getAIProvider()
    const response = await ai.chat(withDate)
    res.json({ content: response })
  } catch (err: any) {
    handleAIError(err, res)
  }
})

router.post('/generate', requireAuth, checkTokens, async (req, res) => {
  const user = (req as any).user
  const { prompt, systemPrompt } = req.body
  if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'Prompt required' })
  if (prompt.length > 8000) return res.status(400).json({ error: 'Prompt too long (max 8000 chars)' })

  // Deduct token BEFORE the AI call
  if (!user.isAdmin) {
    const deducted = await deductToken(user.id)
    if (!deducted) return res.status(429).json({ error: 'Insufficient tokens', code: 'NO_TOKENS' })
  }

  try {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const ai = await getAIProvider()
    const response = await ai.generate(prompt, systemPrompt ? `Today is ${today}.\n\n${systemPrompt}` : `Today is ${today}.`)
    res.json({ content: response })
  } catch (err: any) {
    handleAIError(err, res)
  }
})

router.post('/research', requireAuth, checkTokens, async (req, res) => {
  const user = (req as any).user
  const { topic } = req.body
  if (!topic || typeof topic !== 'string') return res.status(400).json({ error: 'Topic required' })
  if (topic.length > 300) return res.status(400).json({ error: 'Topic too long (max 300 chars)' })

  // Deduct token BEFORE the AI call
  if (!user.isAdmin) {
    const deducted = await deductToken(user.id)
    if (!deducted) return res.status(429).json({ error: 'Insufficient tokens', code: 'NO_TOKENS' })
  }

  try {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const webContext = await getWebContextString(`${topic} latest trends news 2026`)
    const ai = await getAIProvider()
    const prompt = `Today is ${today}. Research the following topic: "${topic}"\n\n${webContext}\n\nUsing the real-time data above AND your training knowledge, provide a comprehensive, specific, and actionable research report.`
    const response = await ai.generate(prompt, `You are a business research expert with access to real-time web data. Today is ${today}. Be specific, cite real trends from the web context, and give actionable insights.`)
    res.json({ content: response })
  } catch (err: any) {
    handleAIError(err, res)
  }
})

export default router
