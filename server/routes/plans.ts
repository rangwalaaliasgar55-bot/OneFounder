import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { db } from '../db'
import { businessPlans } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import { getAIProvider } from '../ai'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  const plans = await db.select().from(businessPlans)
    .where(eq(businessPlans.userId, user.id))
    .orderBy(desc(businessPlans.createdAt))
  res.json(plans)
})

router.post('/generate', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { title, businessType, targetMarket, uniqueValue, ideaId } = req.body

  const prompt = `Create a comprehensive business plan for:
- Business: ${title}
- Type: ${businessType || 'SaaS'}
- Target Market: ${targetMarket || 'Small businesses'}
- Unique Value: ${uniqueValue || 'AI-powered automation'}

Include:
1. BUSINESS MODEL: Revenue streams, pricing strategy, unit economics
2. CUSTOMER PROFILE: Demographics, psychographics, pain points, jobs-to-be-done
3. PRICING STRATEGY: Tiers, pricing psychology, competitive positioning
4. ACQUISITION STRATEGY: Top 5 channels, cost per acquisition estimates, timeline
5. LAUNCH STRATEGY: Pre-launch, launch day, post-launch (90 days)
6. GROWTH STRATEGY: 6-month, 12-month, 24-month milestones
7. FINANCIAL PROJECTIONS: Month 1-12 revenue projections

Return as JSON with keys: businessModel, customerProfile, pricing, acquisitionStrategy, launchStrategy, growthStrategy, financialProjections`

  try {
    const ai = await getAIProvider()
    const response = await ai.generate(prompt, 'You are a startup business advisor. Return ONLY valid JSON.')

    let data: any = {}
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) data = JSON.parse(jsonMatch[0])
    } catch { data = {} }

    const [plan] = await db.insert(businessPlans).values({
      userId: user.id,
      ideaId: ideaId || null,
      title,
      businessModel: data.businessModel,
      customerProfile: data.customerProfile,
      pricing: data.pricing,
      acquisitionStrategy: data.acquisitionStrategy,
      launchStrategy: data.launchStrategy,
      growthStrategy: data.growthStrategy,
      financialProjections: data.financialProjections,
      fullPlan: response,
    }).returning()

    res.json(plan)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', requireAuth, async (req, res) => {
  const user = (req as any).user
  const [plan] = await db.select().from(businessPlans)
    .where(eq(businessPlans.id, req.params.id as string))
  if (!plan || plan.userId !== user.id) return res.status(404).json({ error: 'Not found' })
  res.json(plan)
})

router.delete('/:id', requireAuth, async (req, res) => {
  await db.delete(businessPlans).where(eq(businessPlans.id, req.params.id as string))
  res.json({ success: true })
})

export default router
