import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { db } from '../db/index.js'
import { businessIdeas, projects, tasks, leads, contentPieces, researchReports, businessPlans } from '../db/schema.js'
import { eq, count, desc } from 'drizzle-orm'

const router = Router()

router.get('/stats', requireAuth, async (req, res) => {
  const user = (req as any).user

  const [ideasCount] = await db.select({ count: count() }).from(businessIdeas).where(eq(businessIdeas.userId, user.id))
  const [projectsCount] = await db.select({ count: count() }).from(projects).where(eq(projects.userId, user.id))
  const [tasksCount] = await db.select({ count: count() }).from(tasks).where(eq(tasks.userId, user.id))
  const [leadsCount] = await db.select({ count: count() }).from(leads).where(eq(leads.userId, user.id))
  const [contentCount] = await db.select({ count: count() }).from(contentPieces).where(eq(contentPieces.userId, user.id))
  const [reportsCount] = await db.select({ count: count() }).from(researchReports).where(eq(researchReports.userId, user.id))
  const [plansCount] = await db.select({ count: count() }).from(businessPlans).where(eq(businessPlans.userId, user.id))

  const recentIdeas = await db.select().from(businessIdeas)
    .where(eq(businessIdeas.userId, user.id))
    .orderBy(desc(businessIdeas.createdAt))
    .limit(5)

  const recentTasks = await db.select().from(tasks)
    .where(eq(tasks.userId, user.id))
    .orderBy(desc(tasks.createdAt))
    .limit(5)

  const recentLeads = await db.select().from(leads)
    .where(eq(leads.userId, user.id))
    .orderBy(desc(leads.createdAt))
    .limit(5)

  res.json({
    stats: {
      ideas: Number(ideasCount.count),
      projects: Number(projectsCount.count),
      tasks: Number(tasksCount.count),
      leads: Number(leadsCount.count),
      content: Number(contentCount.count),
      reports: Number(reportsCount.count),
      plans: Number(plansCount.count),
    },
    recent: {
      ideas: recentIdeas,
      tasks: recentTasks,
      leads: recentLeads,
    }
  })
})

export default router
