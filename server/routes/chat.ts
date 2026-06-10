import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { db } from '../db'
import { chatMessages } from '../db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { getAIProvider } from '../ai'
import { v4 as uuidv4 } from 'uuid'

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

  const history = await db.select().from(chatMessages)
    .where(and(
      eq(chatMessages.userId, user.id),
      eq(chatMessages.sessionId, session)
    ))
    .orderBy(chatMessages.createdAt)

  const agentPrompts: Record<string, string> = {
    ceo: 'You are the CEO Agent for OneFounder. You help with business strategy, decision-making, prioritization, and high-level planning. Be strategic, decisive, and results-focused.',
    marketing: 'You are the Marketing Agent. You help with growth strategies, content marketing, brand positioning, and customer acquisition. Be creative and data-driven.',
    seo: 'You are the SEO Agent. You help with keyword research, content optimization, technical SEO, and ranking strategies. Be specific and actionable.',
    sales: 'You are the Sales Agent. You help with lead generation, outreach scripts, proposals, and closing strategies. Be persuasive and practical.',
    research: 'You are the Research Agent. You analyze competitors, markets, and opportunities. Provide data-driven insights and strategic recommendations.',
    operations: 'You are the Operations Agent. You help optimize workflows, processes, and business systems for maximum efficiency.',
    product: 'You are the Product Agent. You help with product planning, feature prioritization, user stories, and product strategy.',
    founder: `You are the Founder AI, the personal AI assistant of OneFounder. You are a brilliant, experienced startup advisor and business strategist. Help this founder build and grow their business with practical, actionable advice. Be direct, insightful, and encouraging.`,
  }

  const systemPrompt = agentPrompts[agentType] || agentPrompts.founder
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
      model: 'ollama',
    }).returning()

    res.json({ message: saved, sessionId: session })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
