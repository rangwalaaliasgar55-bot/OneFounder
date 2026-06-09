import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { db } from '../db'
import { leads } from '../db/schema'
import { eq, desc } from 'drizzle-orm'

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
  const [updated] = await db.update(leads)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(leads.id, req.params.id))
    .returning()
  res.json(updated)
})

router.delete('/:id', requireAuth, async (req, res) => {
  await db.delete(leads).where(eq(leads.id, req.params.id))
  res.json({ success: true })
})

export default router
