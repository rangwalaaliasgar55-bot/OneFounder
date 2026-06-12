import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { checkTokens, deductToken } from '../middleware/tokens'
import { getAIProvider, getAIStatus } from '../ai'
import { getWebContextString } from '../ai/webSearch'

const router = Router()

router.get('/status', async (req, res) => {
  const status = await getAIStatus()
  res.json(status)
})

// GET /api/ai/tokens — current user's token balance
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
  try {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const withDate = messages.map((m: any, i: number) =>
      i === 0 && m.role === 'system'
        ? { ...m, content: `Today is ${today}.\n\n${m.content}` }
        : m
    )
    const ai = await getAIProvider()
    const response = await ai.chat(withDate)
    if (!user.isAdmin) await deductToken(user.id)
    res.json({ content: response })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/generate', requireAuth, checkTokens, async (req, res) => {
  const user = (req as any).user
  const { prompt, systemPrompt } = req.body
  if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'Prompt required' })
  if (prompt.length > 8000) return res.status(400).json({ error: 'Prompt too long (max 8000 chars)' })
  try {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const ai = await getAIProvider()
    const response = await ai.generate(prompt, systemPrompt ? `Today is ${today}.\n\n${systemPrompt}` : `Today is ${today}.`)
    if (!user.isAdmin) await deductToken(user.id)
    res.json({ content: response })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/research', requireAuth, checkTokens, async (req, res) => {
  const user = (req as any).user
  const { topic } = req.body
  if (!topic || typeof topic !== 'string') return res.status(400).json({ error: 'Topic required' })
  if (topic.length > 300) return res.status(400).json({ error: 'Topic too long (max 300 chars)' })
  try {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const webContext = await getWebContextString(`${topic} latest trends news 2025`)
    const ai = await getAIProvider()
    const prompt = `Today is ${today}. Research the following topic: "${topic}"\n\n${webContext}\n\nUsing the real-time data above AND your training knowledge, provide a comprehensive, specific, and actionable research report.`
    const response = await ai.generate(prompt, `You are a business research expert with access to real-time web data. Today is ${today}. Be specific, cite real trends from the web context, and give actionable insights.`)
    if (!user.isAdmin) await deductToken(user.id)
    res.json({ content: response })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
