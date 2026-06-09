import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { db } from '../db'
import { financeEntries } from '../db/schema'
import { eq, desc } from 'drizzle-orm'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  const entries = await db.select().from(financeEntries)
    .where(eq(financeEntries.userId, user.id))
    .orderBy(desc(financeEntries.date))
  res.json(entries)
})

router.post('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { type, amount, description, category, recurring, recurringInterval, date } = req.body
  const [entry] = await db.insert(financeEntries).values({
    userId: user.id,
    type,
    amount: Math.round(parseFloat(amount) * 100),
    description,
    category: category || 'Other',
    recurring: recurring || false,
    recurringInterval: recurringInterval || null,
    date: date ? new Date(date) : new Date(),
  }).returning()
  res.json({ ...entry, amount: entry.amount / 100 })
})

router.patch('/:id', requireAuth, async (req, res) => {
  const user = (req as any).user
  const updateData = { ...req.body, updatedAt: new Date() }
  if (updateData.amount) updateData.amount = Math.round(parseFloat(updateData.amount) * 100)
  const [updated] = await db.update(financeEntries)
    .set(updateData)
    .where(eq(financeEntries.id, req.params.id))
    .returning()
  res.json({ ...updated, amount: updated.amount / 100 })
})

router.delete('/:id', requireAuth, async (req, res) => {
  await db.delete(financeEntries).where(eq(financeEntries.id, req.params.id))
  res.json({ success: true })
})

router.get('/summary', requireAuth, async (req, res) => {
  const user = (req as any).user
  const entries = await db.select().from(financeEntries)
    .where(eq(financeEntries.userId, user.id))

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const thisMonth = entries.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const revenue = thisMonth.filter(e => e.type === 'revenue').reduce((s, e) => s + e.amount, 0)
  const expenses = thisMonth.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0)
  const subscriptions = entries.filter(e => e.type === 'subscription' && e.recurring).reduce((s, e) => s + e.amount, 0)

  res.json({
    mrr: subscriptions / 100,
    monthRevenue: revenue / 100,
    monthExpenses: expenses / 100,
    profit: (revenue - expenses) / 100,
    totalEntries: entries.length,
  })
})

export default router
