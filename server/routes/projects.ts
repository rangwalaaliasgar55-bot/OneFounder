import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { db } from '../db/index.js'
import { projects, milestones, tasks } from '../db/schema.js'
import { eq, desc, and } from 'drizzle-orm'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const list = await db.select().from(projects)
      .where(eq(projects.userId, user.id))
      .orderBy(desc(projects.createdAt))
    res.json(list)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load projects' })
  }
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const { name, description, status, color, emoji, dueDate, ideaId } = req.body
    if (!name) return res.status(400).json({ error: 'Project name is required' })
    const [project] = await db.insert(projects).values({
      userId: user.id,
      name,
      description,
      status: status || 'active',
      color,
      emoji,
      dueDate: dueDate ? new Date(dueDate) : null,
      ideaId,
    }).returning()
    res.json(project)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create project' })
  }
})

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const [project] = await db.select().from(projects).where(eq(projects.id, req.params.id as string))
    if (!project || project.userId !== user.id) return res.status(404).json({ error: 'Not found' })
    const ms = await db.select().from(milestones).where(eq(milestones.projectId, project.id))
    const ts = await db.select().from(tasks).where(eq(tasks.projectId, project.id))
    res.json({ ...project, milestones: ms, tasks: ts })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load project' })
  }
})

router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const { name, description, status, color, emoji, dueDate } = req.body
    const updateData: any = { updatedAt: new Date() }
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (color !== undefined) updateData.color = color
    if (emoji !== undefined) updateData.emoji = emoji
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null

    const [updated] = await db.update(projects)
      .set(updateData)
      .where(and(eq(projects.id, req.params.id as string), eq(projects.userId, user.id)))
      .returning()
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update project' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const result = await db.delete(projects)
      .where(and(eq(projects.id, req.params.id as string), eq(projects.userId, user.id)))
      .returning({ id: projects.id })
    if (result.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete project' })
  }
})

router.get('/:id/tasks', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    // Verify user owns the project
    const [project] = await db.select({ id: projects.id }).from(projects)
      .where(and(eq(projects.id, req.params.id as string), eq(projects.userId, user.id)))
    if (!project) return res.status(404).json({ error: 'Project not found' })
    const ts = await db.select().from(tasks).where(eq(tasks.projectId, req.params.id as string)).orderBy(desc(tasks.createdAt))
    res.json(ts)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load tasks' })
  }
})

router.post('/:id/tasks', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const { title, description, status, priority, dueDate, milestoneId } = req.body
    if (!title) return res.status(400).json({ error: 'Task title is required' })
    const [task] = await db.insert(tasks).values({
      projectId: req.params.id as string,
      userId: user.id,
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      milestoneId,
    }).returning()
    res.json(task)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create task' })
  }
})

router.patch('/tasks/:taskId', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const { title, description, status, priority, dueDate, milestoneId } = req.body
    const updateData: any = { updatedAt: new Date() }
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (milestoneId !== undefined) updateData.milestoneId = milestoneId
    if (status === 'done') updateData.completedAt = new Date()

    const [task] = await db.update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, req.params.taskId as string), eq(tasks.userId, user.id)))
      .returning()
    if (!task) return res.status(404).json({ error: 'Not found' })
    res.json(task)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update task' })
  }
})

export default router
