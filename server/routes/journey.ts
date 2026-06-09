import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { db } from '../db'
import { journeyMilestones } from '../db/schema'
import { eq, desc } from 'drizzle-orm'

const router = Router()

const DEFAULT_MILESTONES = [
  { key: 'idea', stage: 'Idea', title: 'First Business Idea', description: 'You had your first startup idea', icon: '💡', xp: 50, order: 1 },
  { key: 'validation', stage: 'Validation', title: 'Idea Validated', description: 'Validated demand with real people', icon: '✅', xp: 100, order: 2 },
  { key: 'research', stage: 'Research', title: 'Market Researched', description: 'Completed competitor & market analysis', icon: '🔍', xp: 75, order: 3 },
  { key: 'plan', stage: 'Planning', title: 'Business Plan Created', description: 'Full business plan generated', icon: '📋', xp: 100, order: 4 },
  { key: 'mvp', stage: 'MVP', title: 'MVP Built', description: 'Minimum viable product launched', icon: '🚀', xp: 200, order: 5 },
  { key: 'first_user', stage: 'Traction', title: 'First User', description: 'First real user signed up', icon: '👤', xp: 150, order: 6 },
  { key: 'first_content', stage: 'Marketing', title: 'First Content Published', description: 'Published first marketing content', icon: '✍️', xp: 75, order: 7 },
  { key: 'first_lead', stage: 'Sales', title: 'First Lead', description: 'First potential customer in your CRM', icon: '🎯', xp: 100, order: 8 },
  { key: 'first_customer', stage: 'Revenue', title: 'First Customer', description: 'First paying customer', icon: '💳', xp: 300, order: 9 },
  { key: 'mrr_100', stage: 'Growth', title: '$100 MRR', description: 'First $100 in monthly recurring revenue', icon: '💵', xp: 200, order: 10 },
  { key: 'mrr_1k', stage: 'Growth', title: '$1K MRR', description: 'Reached $1,000 monthly recurring revenue', icon: '💰', xp: 500, order: 11 },
  { key: 'seo_top10', stage: 'Visibility', title: 'First Top 10 Ranking', description: 'A keyword ranked in Google top 10', icon: '🔎', xp: 150, order: 12 },
  { key: 'team', stage: 'Scale', title: 'First Team Member', description: 'Hired or partnered with someone', icon: '🤝', xp: 200, order: 13 },
  { key: 'mrr_10k', stage: 'Scale', title: '$10K MRR', description: 'Reached $10,000 monthly recurring revenue', icon: '🏆', xp: 1000, order: 14 },
  { key: 'mrr_100k', stage: 'Success', title: '$100K MRR', description: 'Reached $100K monthly recurring revenue', icon: '🦄', xp: 5000, order: 15 },
]

router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  let milestones = await db.select().from(journeyMilestones)
    .where(eq(journeyMilestones.userId, user.id))
    .orderBy(journeyMilestones.order)

  // Seed defaults if none exist
  if (milestones.length === 0) {
    const inserted = await Promise.all(DEFAULT_MILESTONES.map(async (m) => {
      const [row] = await db.insert(journeyMilestones).values({
        userId: user.id, key: m.key, stage: m.stage, title: m.title,
        description: m.description, icon: m.icon, xp: m.xp, order: m.order,
        completed: false,
      }).returning()
      return row
    }))
    milestones = inserted.sort((a, b) => a.order - b.order)
  }

  res.json(milestones)
})

router.patch('/:id', requireAuth, async (req, res) => {
  const { completed, notes } = req.body
  const [updated] = await db.update(journeyMilestones)
    .set({
      completed: completed ?? undefined,
      completedAt: completed ? new Date() : null,
      notes: notes ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(journeyMilestones.id, req.params.id))
    .returning()
  res.json(updated)
})

export default router
