import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { db } from '../db'
import { leads } from '../db/schema'
import { eq, desc, and } from 'drizzle-orm'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  const list = await db.select().from(leads)
    .where(eq(leads.userId, user.id))
    .orderBy(desc(leads.createdAt))
  res.json(list)
})

router.post('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  const [lead] = await db.insert(leads).values({ ...req.body, userId: user.id }).returning()
  res.json(lead)
})

router.patch('/:id', requireAuth, async (req, res) => {
  const user = (req as any).user
  const [updated] = await db.update(leads)
    .set({ ...req.body, updatedAt: new Date() })
    .where(and(eq(leads.id, req.params.id as string), eq(leads.userId, user.id)))
    .returning()
  if (!updated) return res.status(404).json({ error: 'Not found' })
  res.json(updated)
})

router.delete('/:id', requireAuth, async (req, res) => {
  const user = (req as any).user
  await db.delete(leads)
    .where(and(eq(leads.id, req.params.id as string), eq(leads.userId, user.id)))
  res.json({ success: true })
})

export default router
