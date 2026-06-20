import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { checkTokens, deductToken } from '../middleware/tokens.js'
import { validate } from '../middleware/validate.js'
import { ChatMessageSchema } from '../middleware/schemas.js'
import { db } from '../db/index.js'
import { chatMessages } from '../db/schema.js'
import { eq, desc, and, sql } from 'drizzle-orm'
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
  const user = (req as any).user
  // One row per session — use DB-level aggregation, not JS dedup of all rows
  const sessions = await db
    .select({
      id: chatMessages.sessionId,
      lastMessage: sql<string>`substring(max(case when ${chatMessages.role} = 'user' then ${chatMessages.content} end), 1, 80)`,
      createdAt: sql<Date>`min(${chatMessages.createdAt})`,
      updatedAt: sql<Date>`max(${chatMessages.createdAt})`,
      messageCount: sql<number>`count(*)`,
    })
    .from(chatMessages)
    .where(eq(chatMessages.userId, user.id))
    .groupBy(chatMessages.sessionId)
    .orderBy(sql`max(${chatMessages.createdAt}) desc`)
    .limit(50)  // cap at 50 sessions in sidebar

  res.json(sessions)
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

router.post('/send', requireAuth, checkTokens, validate(ChatMessageSchema), async (req, res) => {
  const user = (req as any).user
  const { message, sessionId, agentType, model } = req.body

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

    if (!user.isAdmin) await deductToken(user.id)
    res.json({
      message: saved || { id: uuidv4(), role: 'assistant', content: result.response },
      sessionId: result.sessionId,
      mode: result.mode,
      modeLabel: result.modeLabel,
      confidence: result.confidence,
      secondaryModes: result.secondaryModes,
      webSearchUsed: result.webSearchUsed,
      contextSources: result.contextSources,
    })
  } catch (err: any) {
    handleAIError(err, res)
  }
})

router.post('/stream', requireAuth, checkTokens, validate(ChatMessageSchema), async (req, res) => {
  const user = (req as any).user
  const { message, sessionId, agentType, model } = req.body

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

    let deducted = false
    for await (const chunk of gen) {
      send(chunk.type, typeof chunk.data === 'string' ? chunk.data : JSON.stringify(chunk.data))
      if ((chunk.type === 'done' || chunk.type === 'error') && !deducted) {
        deducted = true
        if (!user.isAdmin && chunk.type === 'done') await deductToken(user.id).catch(() => {})
        break
      }
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

router.get('/route/analyze', async (req, res) => {
  const { message } = req.query
  if (!message || typeof message !== 'string') return res.status(400).json({ error: 'Message required' })
  const result = detectExpertMode(message)
  res.json(result)
})

export default router
