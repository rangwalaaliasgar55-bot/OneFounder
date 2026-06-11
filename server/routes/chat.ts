import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { db } from '../db'
import { chatMessages } from '../db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { brain } from '../ai/brain'
import { detectExpertMode } from '../ai/router'
import { logActivity } from '../ai/activity'

const router = Router()

router.get('/sessions', requireAuth, async (req, res) => {
  const user = (req as any).user
  const messages = await db.select().from(chatMessages)
    .where(eq(chatMessages.userId, user.id))
    .orderBy(desc(chatMessages.createdAt))

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
})

router.get('/:sessionId', requireAuth, async (req, res) => {
  const user = (req as any).user
  const messages = await db.select().from(chatMessages)
    .where(and(
      eq(chatMessages.userId, user.id),
      eq(chatMessages.sessionId, req.params.sessionId as string)
    ))
    .orderBy(chatMessages.createdAt)
  res.json(messages)
})

router.post('/send', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { message, sessionId, agentType, model } = req.body
  if (!message || typeof message !== 'string') return res.status(400).json({ error: 'Message required' })
  if (message.length > 4000) return res.status(400).json({ error: 'Message too long (max 4000 chars)' })

  await logActivity(user.id, 'sent_message', 'chat', sessionId, { agentType }).catch(() => {})

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
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/stream', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { message, sessionId, agentType, model } = req.body
  if (!message || typeof message !== 'string') return res.status(400).json({ error: 'Message required' })
  if (message.length > 4000) return res.status(400).json({ error: 'Message too long (max 4000 chars)' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  const send = (event: string, data: string) => {
    res.write(`event: ${event}\ndata: ${data}\n\n`)
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
      send(chunk.type, typeof chunk.data === 'string' ? chunk.data : JSON.stringify(chunk.data))
      if (chunk.type === 'done' || chunk.type === 'error') break
    }
  } catch (err: any) {
    send('error', err.message || 'Stream failed')
  } finally {
    res.end()
  }
})

router.get('/route/analyze', async (req, res) => {
  const { message } = req.query
  if (!message || typeof message !== 'string') return res.status(400).json({ error: 'Message required' })
  const result = detectExpertMode(message)
  res.json(result)
})

export default router
