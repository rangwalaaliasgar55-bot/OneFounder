import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { db } from '../db/index.js'
import {
  aiMemories, aiInsights, userActivityLog,
  tasks, leads, financeEntries, contentPieces,
  businessIdeas, projects, seoKeywords,
} from '../db/schema.js'
import { eq, desc, and, gte, count } from 'drizzle-orm'
import { getAIProvider } from '../ai/index.js'
import { assembleFounderContext } from '../ai/context.js'
import { logActivity } from '../ai/activity.js'

const router = Router()

// ─── Get AI Memories ─────────────────────────────────────────────────────────
router.get('/memories', requireAuth, async (req, res) => {
  const user = (req as any).user
  try {
    const memories = await db.select().from(aiMemories)
      .where(eq(aiMemories.userId, user.id))
      .orderBy(desc(aiMemories.importance))
      .limit(50)
    res.json(memories)
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

router.post('/memories', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { type, content, source, importance, tags } = req.body
  if (!content || !type) return res.status(400).json({ error: 'type and content required' })
  try {
    const [mem] = await db.insert(aiMemories).values({
      userId: user.id,
      type,
      content,
      source: source || 'manual',
      importance: importance || 5,
      tags: tags || [],
    }).returning()
    res.json(mem)
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

router.delete('/memories/:id', requireAuth, async (req, res) => {
  const user = (req as any).user
  const id = String(req.params.id)
  try {
    await db.delete(aiMemories)
      .where(and(eq(aiMemories.id, id), eq(aiMemories.userId, user.id)))
    res.json({ success: true })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// ─── Get AI Insights ──────────────────────────────────────────────────────────
router.get('/insights', requireAuth, async (req, res) => {
  const user = (req as any).user
  try {
    const insights = await db.select().from(aiInsights)
      .where(and(eq(aiInsights.userId, user.id), eq(aiInsights.dismissed, false)))
      .orderBy(desc(aiInsights.createdAt))
      .limit(20)
    res.json(insights)
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

router.patch('/insights/:id/read', requireAuth, async (req, res) => {
  const user = (req as any).user
  const id = String(req.params.id)
  try {
    await db.update(aiInsights).set({ read: true })
      .where(and(eq(aiInsights.id, id), eq(aiInsights.userId, user.id)))
    res.json({ success: true })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

router.patch('/insights/:id/dismiss', requireAuth, async (req, res) => {
  const user = (req as any).user
  const id = String(req.params.id)
  try {
    await db.update(aiInsights).set({ dismissed: true })
      .where(and(eq(aiInsights.id, id), eq(aiInsights.userId, user.id)))
    res.json({ success: true })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// ─── Generate Proactive Insights ─────────────────────────────────────────────
router.post('/insights/generate', requireAuth, async (req, res) => {
  const user = (req as any).user
  const uid = user.id

  try {
    const context = await assembleFounderContext(uid)
    const ai = await getAIProvider()

    const prompt = `You are a proactive AI advisor for a founder. Analyze their current situation and generate 3-5 specific, actionable insights.

${context.businessSnapshot}

Financial: ${context.financialContext}
Urgent: ${context.urgentItems}
Recent activity: ${context.recentActivity}
Founder stage: ${context.stage} | Goal: ${context.goals}

Generate insights that are:
- Specific to their actual data (not generic)
- Immediately actionable
- High signal (not obvious)

Return JSON array:
[{
  "type": "opportunity|risk|recommendation|pattern|alert",
  "title": "short title",
  "body": "2-3 sentence specific insight with a clear action",
  "module": "ideas|projects|crm|content|seo|finance|chat",
  "priority": "high|medium|low"
}]

Return ONLY valid JSON array.`

    let insights: any[] = []
    try {
      const raw = await ai.generate(prompt, 'You are a proactive startup advisor. Return ONLY valid JSON array.')
      const match = raw.match(/\[[\s\S]*\]/)
      if (match) insights = JSON.parse(match[0])
    } catch {}

    if (!Array.isArray(insights) || insights.length === 0) {
      insights = buildFallbackInsights(context)
    }

    const saved = await Promise.all(
      insights.slice(0, 5).map(ins =>
        db.insert(aiInsights).values({
          userId: uid,
          type: ins.type || 'recommendation',
          title: ins.title || 'New Insight',
          body: ins.body || '',
          module: ins.module || null,
          priority: ins.priority || 'medium',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }).returning()
      )
    )

    await logActivity(uid, 'generated_insights', 'intelligence')
    res.json(saved.map(s => s[0]))
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// ─── Behavioral Analysis ─────────────────────────────────────────────────────
router.get('/behavior', requireAuth, async (req, res) => {
  const user = (req as any).user
  const uid = user.id
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  try {
    const [recentActivity, allActivity, allTasks, allLeads] = await Promise.all([
      db.select().from(userActivityLog)
        .where(and(eq(userActivityLog.userId, uid), gte(userActivityLog.createdAt, sevenDaysAgo)))
        .orderBy(desc(userActivityLog.createdAt)),
      db.select().from(userActivityLog)
        .where(and(eq(userActivityLog.userId, uid), gte(userActivityLog.createdAt, thirtyDaysAgo)))
        .orderBy(desc(userActivityLog.createdAt)),
      db.select().from(tasks).where(eq(tasks.userId, uid)),
      db.select().from(leads).where(eq(leads.userId, uid)),
    ])

    const moduleFrequency: Record<string, number> = {}
    allActivity.forEach(a => {
      moduleFrequency[a.module] = (moduleFrequency[a.module] || 0) + 1
    })

    const topModules = Object.entries(moduleFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([m]) => m)

    const neglectedModules = ['ideas', 'projects', 'crm', 'content', 'seo', 'finance']
      .filter(m => !moduleFrequency[m] || moduleFrequency[m] < 2)

    const taskCompletionRate = allTasks.length > 0
      ? Math.round((allTasks.filter(t => t.status === 'done').length / allTasks.length) * 100)
      : 0

    const actionsPerDay = recentActivity.length / 7

    const momentumScore = Math.min(100, Math.round(
      (Math.min(30, actionsPerDay * 10)) +
      (taskCompletionRate * 0.4) +
      (topModules.length > 0 ? 30 : 0)
    ))

    res.json({
      weeklyActivity: recentActivity.length,
      actionsPerDay: Math.round(actionsPerDay * 10) / 10,
      topModules,
      neglectedModules,
      taskCompletionRate,
      momentumScore,
      moduleFrequency,
      streakDays: computeStreakDays(recentActivity),
    })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// ─── Log Activity ─────────────────────────────────────────────────────────────
router.post('/log', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { action, module, entityId, metadata } = req.body
  if (!action || !module) return res.status(400).json({ error: 'action and module required' })
  try {
    await logActivity(user.id, action, module, entityId, metadata)
    res.json({ success: true })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// ─── Weekly Executive Review ──────────────────────────────────────────────────
router.post('/weekly-review', requireAuth, async (req, res) => {
  const user = (req as any).user
  try {
    const context = await assembleFounderContext(user.id)
    const ai = await getAIProvider()

    const prompt = `Generate a weekly executive review for this founder.

${context.businessSnapshot}
Financial: ${context.financialContext}
Recent activity: ${context.recentActivity}
Memories: ${context.memories}
Stage: ${context.stage} | Goal: ${context.goals}

Return a structured weekly review JSON:
{
  "weekSummary": "2-3 sentence honest assessment of this week",
  "wins": ["specific win 1", "specific win 2"],
  "misses": ["what was missed or fell short"],
  "nextWeekPriorities": [{"priority":"","rationale":"","module":""}],
  "founderAdvice": "1 paragraph of direct, honest founder advice specific to their situation",
  "momentumRating": 1-10,
  "momentumRationale": "why this score"
}

Return ONLY valid JSON.`

    let review: any = {}
    try {
      const raw = await ai.generate(prompt, 'You are a startup advisor. Return ONLY valid JSON.')
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) review = JSON.parse(match[0])
    } catch {}

    if (!review.weekSummary) {
      review = {
        weekSummary: `Based on your activity this week, you've been ${context.recentActivity || 'getting started'}. Focus on consistent execution to build momentum.`,
        wins: ['Continued building toward your goals'],
        misses: ['Consistent daily activity needs improvement'],
        nextWeekPriorities: [
          { priority: 'Complete 3 high-priority tasks', rationale: 'Execution velocity is the #1 startup advantage', module: 'projects' },
          { priority: 'Follow up with all active leads', rationale: 'Speed of follow-up is your #1 conversion lever', module: 'crm' },
        ],
        founderAdvice: `You're in the ${context.stage} stage. The most important thing you can do right now is focus on ${context.goals}. Every day of execution compounds.`,
        momentumRating: 5,
        momentumRationale: 'Building momentum — keep pushing',
      }
    }

    res.json({ ...review, generatedAt: new Date().toISOString() })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function computeStreakDays(activity: any[]): number {
  if (activity.length === 0) return 0
  const days = new Set(activity.map(a => new Date(a.createdAt).toDateString()))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (days.has(d.toDateString())) streak++
    else if (i > 0) break
  }
  return streak
}

function buildFallbackInsights(context: any): any[] {
  return [
    {
      type: 'recommendation',
      title: 'Focus on your highest-leverage activity today',
      body: `Based on your ${context.stage} stage and goal to ${context.goals}, the most important thing you can do today is push your top priority forward. Consistent daily execution compounds faster than any single big move.`,
      module: 'projects',
      priority: 'high',
    },
    {
      type: 'opportunity',
      title: 'Your context is now powering every AI interaction',
      body: `The AI now has full context on your business: ${context.businessSnapshot.split('\n')[0]}. Every chat response, brief, and recommendation is now personalized to your actual situation.`,
      module: 'chat',
      priority: 'medium',
    },
  ]
}

export default router
