import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { db } from '../db'
import { chatMessages } from '../db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { getAIProvider } from '../ai'
import { v4 as uuidv4 } from 'uuid'
import { assembleFounderContext, buildSystemPromptWithContext } from '../ai/context'
import { extractAndStoreMemories } from '../ai/memory'
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
  const { message, sessionId, agentType } = req.body
  if (!message) return res.status(400).json({ error: 'Message required' })

  const session = sessionId || uuidv4()

  await db.insert(chatMessages).values({
    userId: user.id,
    sessionId: session,
    role: 'user',
    content: message,
  })

  await logActivity(user.id, 'sent_message', 'chat', session, { agentType })

  const history = await db.select().from(chatMessages)
    .where(and(
      eq(chatMessages.userId, user.id),
      eq(chatMessages.sessionId, session)
    ))
    .orderBy(chatMessages.createdAt)

  const agentBasePrompts: Record<string, string> = {
    ceo: 'You are the CEO Agent for OneFounder. You help with business strategy, decision-making, prioritization, and high-level planning. Be strategic, decisive, and results-focused. Always reference the founder context below to give specific, not generic, advice.',
    marketing: 'You are the Marketing Agent. You help with growth strategies, content marketing, brand positioning, and customer acquisition. Be creative and data-driven. Use the founder context to make your recommendations specific to their stage and industry.',
    seo: 'You are the SEO Agent. You help with keyword research, content optimization, technical SEO, and ranking strategies. Be specific and actionable. Reference any keywords or content already tracked.',
    sales: 'You are the Sales Agent. You help with lead generation, outreach scripts, proposals, and closing strategies. Reference the founder\'s actual leads and pipeline when giving advice.',
    research: 'You are the Research Agent. You analyze competitors, markets, and opportunities. Provide data-driven insights and strategic recommendations specific to the founder\'s industry and stage.',
    operations: 'You are the Operations Agent. You help optimize workflows, processes, and business systems for maximum efficiency. Be specific about which OneFounder modules to leverage.',
    product: 'You are the Product Agent. You help with product planning, feature prioritization, user stories, and product strategy. Reference the founder\'s actual ideas and projects.',
    founder: 'You are the Founder AI — a brilliant, experienced startup advisor and business strategist embedded inside OneFounder. You have full context on this founder\'s business, goals, and current situation. Give direct, specific, personalized advice. Never be generic. Always reference their actual data.',
  }

  const basePrompt = agentBasePrompts[agentType] || agentBasePrompts.founder

  let systemPrompt = basePrompt
  try {
    const context = await assembleFounderContext(user.id)
    systemPrompt = buildSystemPromptWithContext(basePrompt, context)
  } catch {}

  const messages = [
    { role: 'system' as const, content: systemPrompt },
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
      model: agentType || 'founder',
    }).returning()

    extractAndStoreMemories(user.id, message, response, `chat:${agentType || 'founder'}`).catch(() => {})

    res.json({ message: saved, sessionId: session })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
