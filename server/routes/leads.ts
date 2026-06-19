import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { db } from '../db/index.js'
import { leads } from '../db/schema.js'
import { eq, desc, and } from 'drizzle-orm'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const list = await db.select().from(leads)
      .where(eq(leads.userId, user.id))
      .orderBy(desc(leads.createdAt))
    res.json(list)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load leads' })
  }
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const { name, email, company, phone, status, source, notes, value, metadata } = req.body
    if (!name) return res.status(400).json({ error: 'Name is required' })
    const [lead] = await db.insert(leads).values({
      userId: user.id,
      name,
      email,
      company,
      phone,
      status: status || 'lead',
      source,
      notes,
      value: value ? Number(value) : null,
      metadata,
    }).returning()
    res.json(lead)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create lead' })
  }
})

router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const { name, email, company, phone, status, source, notes, value, metadata } = req.body
    const updateData: any = { updatedAt: new Date() }
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (company !== undefined) updateData.company = company
    if (phone !== undefined) updateData.phone = phone
    if (status !== undefined) updateData.status = status
    if (source !== undefined) updateData.source = source
    if (notes !== undefined) updateData.notes = notes
    if (value !== undefined) updateData.value = value ? Number(value) : null
    if (metadata !== undefined) updateData.metadata = metadata

    const [updated] = await db.update(leads)
      .set(updateData)
      .where(and(eq(leads.id, req.params.id as string), eq(leads.userId, user.id)))
      .returning()
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update lead' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const result = await db.delete(leads)
      .where(and(eq(leads.id, req.params.id as string), eq(leads.userId, user.id)))
      .returning({ id: leads.id })
    if (result.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete lead' })
  }
})

export default router
