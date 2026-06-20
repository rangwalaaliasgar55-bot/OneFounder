import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { FinanceEntrySchema } from '../middleware/schemas.js'
import { db } from '../db/index.js'
import { financeEntries } from '../db/schema.js'
import { eq, desc, and } from 'drizzle-orm'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const entries = await db.select().from(financeEntries)
      .where(eq(financeEntries.userId, user.id))
      .orderBy(desc(financeEntries.date))
    res.json(entries.map(e => ({ ...e, amount: e.amount / 100 })))
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load finance entries' })
  }
})

router.post('/', requireAuth, validate(FinanceEntrySchema), async (req, res) => {
  try {
    const user = (req as any).user
    const { type, amount, description, category, recurring, recurringInterval, date, currency } = req.body
    const parsedAmount = amount
    const [entry] = await db.insert(financeEntries).values({
      userId: user.id,
      type,
      amount: Math.round(parsedAmount * 100),
      description,
      category: category || 'Other',
      currency: currency || 'USD',
      recurring: recurring || false,
      recurringInterval: recurringInterval || null,
      date: date ? new Date(date) : new Date(),
    }).returning()
    res.json({ ...entry, amount: entry.amount / 100 })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create entry' })
  }
})

router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const { type, amount, description, category, recurring, recurringInterval, date, currency } = req.body
    const updateData: any = { updatedAt: new Date() }
    if (type !== undefined) updateData.type = type
    if (amount !== undefined) {
      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount)) return res.status(400).json({ error: 'Invalid amount' })
      updateData.amount = Math.round(parsedAmount * 100)
    }
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (currency !== undefined) updateData.currency = currency
    if (recurring !== undefined) updateData.recurring = recurring
    if (recurringInterval !== undefined) updateData.recurringInterval = recurringInterval
    if (date !== undefined) updateData.date = date ? new Date(date) : null

    const [updated] = await db.update(financeEntries)
      .set(updateData)
      .where(and(eq(financeEntries.id, req.params.id as string), eq(financeEntries.userId, user.id)))
      .returning()
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json({ ...updated, amount: updated.amount / 100 })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update entry' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const result = await db.delete(financeEntries)
      .where(and(eq(financeEntries.id, req.params.id as string), eq(financeEntries.userId, user.id)))
      .returning({ id: financeEntries.id })
    if (result.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete entry' })
  }
})

router.get('/summary', requireAuth, async (req, res) => {
  try {
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
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load summary' })
  }
})

export default router
