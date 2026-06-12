import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { generateTaskPlan, saveTasksToDatabase, generateDailyBriefing, generateSprintPlan, generateLaunchChecklist } from '../tasks/taskPlanner'
import { db } from '../db'
import { tasks } from '../db/schema'
import { eq, and, desc } from 'drizzle-orm'

const router = Router()

router.post('/plan', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { goal, timeframe, projectId, save } = req.body

  if (!goal || typeof goal !== 'string') return res.status(400).json({ error: 'Goal required' })
  if (goal.length > 2000) return res.status(400).json({ error: 'Goal too long' })

  try {
    const plan = await generateTaskPlan(
      user.id,
      goal,
      timeframe || '7d',
      projectId
    )

    let savedIds: string[] = []
    if (save) {
      savedIds = await saveTasksToDatabase(user.id, plan, projectId)
    }

    res.json({ plan, savedIds })
  } catch (err: any) {
    console.error('[Task Plan Error]', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.post('/sprint', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { goal, projectId, save } = req.body

  if (!goal) return res.status(400).json({ error: 'Sprint goal required' })

  try {
    const plan = await generateSprintPlan(user.id, goal, projectId)
    let savedIds: string[] = []
    if (save) {
      savedIds = await saveTasksToDatabase(user.id, plan, projectId)
    }
    res.json({ plan, savedIds })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/launch-checklist', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { productName, save } = req.body

  if (!productName) return res.status(400).json({ error: 'Product name required' })

  try {
    const plan = await generateLaunchChecklist(user.id, productName)
    let savedIds: string[] = []
    if (save) {
      savedIds = await saveTasksToDatabase(user.id, plan)
    }
    res.json({ plan, savedIds })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/briefing', requireAuth, async (req, res) => {
  const user = (req as any).user
  try {
    const briefing = await generateDailyBriefing(user.id)
    res.json({ briefing })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { status, priority, limit } = req.query

  try {
    const conditions = [eq(tasks.userId, user.id)]
    if (status && typeof status === 'string') conditions.push(eq(tasks.status, status as any))
    if (priority && typeof priority === 'string') conditions.push(eq(tasks.priority, priority))

    const allTasks = await db.select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt))
      .limit(Number(limit) || 100)

    res.json({ tasks: allTasks })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:id', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { status, priority, title, description } = req.body

  try {
    const updates: any = { updatedAt: new Date() }
    if (status) updates.status = status
    if (priority) updates.priority = priority
    if (title) updates.title = title
    if (description) updates.description = description
    if (status === 'done') updates.completedAt = new Date()

    await db.update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, req.params.id as string), eq(tasks.userId, user.id)))

    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  const user = (req as any).user
  try {
    await db.delete(tasks)
      .where(and(eq(tasks.id, req.params.id as string), eq(tasks.userId, user.id)))
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
