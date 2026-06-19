import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { checkTokens, deductToken } from '../middleware/tokens.js'
import { db } from '../db/index.js'
import { chatMessages } from '../db/schema.js'
import { eq, desc, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { brain } from '../ai/brain.js'
import { detectExpertMode } from '../ai/router.js'
import { logActivity } from '../ai/activity.js'
import { OllamaOfflineError } from '../ai/provider.js'

function handleAIError(err: any, res: any) {
  if (err instanceof OllamaOfflineError || err.code === 'OLLAMA_OFFLINE') {
    return res.status(503).json({ error: err.message, code: 'OLLAMA_OFFLINE' })
  }
  res.status(500).json({ error: err.message || 'AI error' })
}

const router = Router()

router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const messages = await db.select().from(chatMessages)
      .where(eq(chatMessages.userId, user.id))
      .orderBy(desc(chatMessages.createdAt))
      .limit(500)

    const sessions = new Map<string, any>()
    messages.forEach(m => {
      if (!sessions.has(m.sessionId)) {
        sessions.set(m.sessionId, {
          id: m.sessionId,
          lastMessage: m.content.substring(0, 80),
          createdAt: m.createdAt,
          role: m.role,
        })
      }
    })

    res.json(Array.from(sessions.values()))
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load sessions' })
  }
})

router.get('/:sessionId', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const messages = await db.select().from(chatMessages)
      .where(and(
        eq(chatMessages.userId, user.id),
        eq(chatMessages.sessionId, req.params.sessionId as string)
      ))
      .orderBy(chatMessages.createdAt)
    res.json(messages)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load messages' })
  }
})

router.post('/send', requireAuth, checkTokens, async (req, res) => {
  const user = (req as any).user
  const { message, sessionId, agentType, model } = req.body
  if (!message || typeof message !== 'string') return res.status(400).json({ error: 'Message required' })
  if (message.length > 4000) return res.status(400).json({ error: 'Message too long (max 4000 chars)' })

  logActivity(user.id, 'sent_message', 'chat', sessionId, { agentType }).catch(() => {})

  // Deduct token BEFORE the AI call to prevent free usage
  if (!user.isAdmin) {
    const deducted = await deductToken(user.id)
    if (!deducted) return res.status(429).json({ error: 'Insufficient tokens', code: 'NO_TOKENS' })
  }

  try {
    const result = await brain.process({
      userId: user.id,
      message,
      sessionId,
      forcedMode: agentType && agentType !== 'founder' ? agentType : undefined,
      useWebSearch: agentType === 'research' || agentType === undefined,
      model: model || undefined,
    })

    const saved = await db.query.chatMessages.findFirst({
      where: and(
        eq(chatMessages.userId, user.id),
        eq(chatMessages.sessionId, result.sessionId)
      ),
      orderBy: [desc(chatMessages.createdAt)],
    })

    res.json({
      message: saved || { id: uuidv4(), role: 'assistant', content: result.response },
      sessionId: result.sessionId,
      mode: result.mode,
      modeLabel: result.modeLabel,
      confidence: result.confidence,
      webSearchUsed: result.webSearchUsed,
    })
  } catch (err: any) {
    handleAIError(err, res)
  }
})

router.post('/stream', requireAuth, checkTokens, async (req, res) => {
  const user = (req as any).user
  const { message, sessionId, agentType, model } = req.body
  if (!message || typeof message !== 'string') return res.status(400).json({ error: 'Message required' })
  if (message.length > 4000) return res.status(400).json({ error: 'Message too long (max 4000 chars)' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  let clientDisconnected = false
  req.on('close', () => { clientDisconnected = true })

  const send = (event: string, data: string) => {
    if (!clientDisconnected) {
      res.write(`event: ${event}\ndata: ${data}\n\n`)
    }
  }

  // Deduct token BEFORE streaming starts
  if (!user.isAdmin) {
    const deducted = await deductToken(user.id)
    if (!deducted) {
      send('error', JSON.stringify({ message: 'Insufficient tokens', code: 'NO_TOKENS' }))
      res.end()
      return
    }
  }

  try {
    const gen = brain.stream({
      userId: user.id,
      message,
      sessionId,
      forcedMode: agentType && agentType !== 'founder' ? agentType : undefined,
      useWebSearch: agentType === 'research' || agentType === undefined,
      model: model || undefined,
    })

    for await (const chunk of gen) {
      if (clientDisconnected) break
      send(chunk.type, typeof chunk.data === 'string' ? chunk.data : JSON.stringify(chunk.data))
      if (chunk.type === 'done' || chunk.type === 'error') break
    }
  } catch (err: any) {
    const isOffline = err instanceof OllamaOfflineError || err.code === 'OLLAMA_OFFLINE'
    send('error', isOffline
      ? JSON.stringify({ message: err.message, code: 'OLLAMA_OFFLINE' })
      : (err.message || 'Stream failed')
    )
  } finally {
    res.end()
  }
})

router.get('/route/analyze', requireAuth, async (req, res) => {
  try {
    const { message } = req.query
    if (!message || typeof message !== 'string') return res.status(400).json({ error: 'Message required' })
    const result = detectExpertMode(message)
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to analyze route' })
  }
})

export default router
