import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { getAIProvider, getAIStatus } from '../ai'

const router = Router()

router.get('/status', requireAuth, async (req, res) => {
  const status = await getAIStatus()
  res.json(status)
})

router.post('/chat', requireAuth, async (req, res) => {
  const { messages } = req.body
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array required' })
  }
  try {
    const ai = await getAIProvider()
    const response = await ai.chat(messages)
    res.json({ content: response })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/generate', requireAuth, async (req, res) => {
  const { prompt, systemPrompt } = req.body
  if (!prompt) return res.status(400).json({ error: 'Prompt required' })
  try {
    const ai = await getAIProvider()
    const response = await ai.generate(prompt, systemPrompt)
    res.json({ content: response })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/research', requireAuth, async (req, res) => {
  const { topic } = req.body
  if (!topic) return res.status(400).json({ error: 'Topic required' })
  try {
    const ai = await getAIProvider()
    const response = await ai.research(topic)
    res.json({ content: response })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
