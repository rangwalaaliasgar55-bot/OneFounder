import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { db } from '../db/index.js'
import { knowledgeBase } from '../db/schema.js'
import { eq, desc, and } from 'drizzle-orm'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const items = await db.select().from(knowledgeBase)
      .where(eq(knowledgeBase.userId, user.id))
      .orderBy(desc(knowledgeBase.createdAt))
    res.json(items)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load knowledge base' })
  }
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const { title, content, type, tags } = req.body
    if (!title || !content) return res.status(400).json({ error: 'Title and content are required' })
    const [item] = await db.insert(knowledgeBase).values({
      userId: user.id,
      title,
      content,
      type: type || 'note',
      tags,
    }).returning()
    res.json(item)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create entry' })
  }
})

router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const { title, content, type, tags } = req.body
    const updateData: any = { updatedAt: new Date() }
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (type !== undefined) updateData.type = type
    if (tags !== undefined) updateData.tags = tags

    const [updated] = await db.update(knowledgeBase)
      .set(updateData)
      .where(and(eq(knowledgeBase.id, req.params.id as string), eq(knowledgeBase.userId, user.id)))
      .returning()
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update entry' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const result = await db.delete(knowledgeBase)
      .where(and(eq(knowledgeBase.id, req.params.id as string), eq(knowledgeBase.userId, user.id)))
      .returning({ id: knowledgeBase.id })
    if (result.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete entry' })
  }
})

export default router
