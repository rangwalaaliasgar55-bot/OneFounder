import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { db } from '../db/index.js'
import { knowledgeBase } from '../db/schema.js'
import { eq, desc, and } from 'drizzle-orm'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  const list = await db.select().from(knowledgeBase)
    .where(eq(knowledgeBase.userId, user.id))
    .orderBy(desc(knowledgeBase.createdAt))
  res.json(list)
})

router.post('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  const [item] = await db.insert(knowledgeBase).values({ ...req.body, userId: user.id }).returning()
  res.json(item)
})

router.patch('/:id', requireAuth, async (req, res) => {
  const user = (req as any).user
  const [updated] = await db.update(knowledgeBase)
    .set({ ...req.body, updatedAt: new Date() })
    .where(and(eq(knowledgeBase.id, req.params.id as string), eq(knowledgeBase.userId, user.id)))
    .returning()
  if (!updated) return res.status(404).json({ error: 'Not found' })
  res.json(updated)
})

router.delete('/:id', requireAuth, async (req, res) => {
  const user = (req as any).user
  await db.delete(knowledgeBase)
    .where(and(eq(knowledgeBase.id, req.params.id as string), eq(knowledgeBase.userId, user.id)))
  res.json({ success: true })
})

export default router
