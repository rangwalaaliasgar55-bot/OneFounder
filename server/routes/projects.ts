import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { db } from '../db/index.js'
import { projects, milestones, tasks } from '../db/schema.js'
import { eq, desc, and } from 'drizzle-orm'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  const list = await db.select().from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(desc(projects.createdAt))
  res.json(list)
})

router.post('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  const [project] = await db.insert(projects).values({ ...req.body, userId: user.id }).returning()
  res.json(project)
})

router.get('/:id', requireAuth, async (req, res) => {
  const user = (req as any).user
  const [project] = await db.select().from(projects).where(eq(projects.id, req.params.id as string))
  if (!project || project.userId !== user.id) return res.status(404).json({ error: 'Not found' })
  const ms = await db.select().from(milestones).where(eq(milestones.projectId, project.id))
  const ts = await db.select().from(tasks).where(eq(tasks.projectId, project.id))
  res.json({ ...project, milestones: ms, tasks: ts })
})

router.patch('/:id', requireAuth, async (req, res) => {
  const user = (req as any).user
  const [updated] = await db.update(projects)
    .set({ ...req.body, updatedAt: new Date() })
    .where(and(eq(projects.id, req.params.id as string), eq(projects.userId, user.id)))
    .returning()
  if (!updated) return res.status(404).json({ error: 'Not found' })
  res.json(updated)
})

router.delete('/:id', requireAuth, async (req, res) => {
  const user = (req as any).user
  await db.delete(projects)
    .where(and(eq(projects.id, req.params.id as string), eq(projects.userId, user.id)))
  res.json({ success: true })
})

router.get('/:id/tasks', requireAuth, async (req, res) => {
  const ts = await db.select().from(tasks).where(eq(tasks.projectId, req.params.id as string)).orderBy(desc(tasks.createdAt))
  res.json(ts)
})

router.post('/:id/tasks', requireAuth, async (req, res) => {
  const user = (req as any).user
  const [task] = await db.insert(tasks).values({ ...req.body, projectId: req.params.id, userId: user.id }).returning()
  res.json(task)
})

router.patch('/tasks/:taskId', requireAuth, async (req, res) => {
  const user = (req as any).user
  const [task] = await db.update(tasks)
    .set({ ...req.body, updatedAt: new Date() })
    .where(and(eq(tasks.id, req.params.taskId as string), eq(tasks.userId, user.id)))
    .returning()
  if (!task) return res.status(404).json({ error: 'Not found' })
  res.json(task)
})

export default router
