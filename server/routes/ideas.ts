import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { db } from '../db'
import { businessIdeas } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import { getAIProvider } from '../ai'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  const ideas = await db.select().from(businessIdeas)
    .where(eq(businessIdeas.userId, user.id))
    .orderBy(desc(businessIdeas.createdAt))
  res.json(ideas)
})

router.post('/generate', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { skills, interests, budget, availableTime, location, experience } = req.body

  const prompt = `Generate 5 unique business ideas based on this founder profile:
- Skills: ${skills || 'general'}
- Interests: ${interests || 'technology'}
- Budget: ${budget || '$1,000-$10,000'}
- Available Time: ${availableTime || '10-20 hours/week'}
- Location: ${location || 'Remote/Global'}
- Experience: ${experience || 'Beginner'}

For each idea provide:
1. Title
2. Type (SaaS/Agency/Marketplace/AI/Local Business)
3. Description (2-3 sentences)
4. Competition level (Low/Medium/High)
5. Revenue Potential (Monthly range)
6. Market Size
7. Difficulty (1-10)
8. 30-60-90 day roadmap

Format as JSON array with fields: title, type, description, competition, revenuePotential, marketSize, difficulty, roadmap`

  try {
    const ai = await getAIProvider()
    const response = await ai.generate(prompt, 'You are an expert startup advisor. Return ONLY valid JSON.')

    let ideas: any[] = []
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        ideas = JSON.parse(jsonMatch[0])
      }
    } catch {
      ideas = [{
        title: 'AI-Powered SaaS Tool',
        type: 'SaaS',
        description: 'Build an AI tool that automates repetitive tasks for small businesses.',
        competition: 'Medium',
        revenuePotential: '$5,000-$50,000/month',
        marketSize: '$50B+',
        difficulty: 6,
        roadmap: { day30: 'MVP', day60: 'Beta users', day90: 'Launch' }
      }]
    }

    const saved = await Promise.all(ideas.map(async (idea: any) => {
      const [saved] = await db.insert(businessIdeas).values({
        userId: user.id,
        title: idea.title || 'Business Idea',
        description: idea.description,
        type: idea.type,
        competition: idea.competition,
        revenuePotential: idea.revenuePotential,
        marketSize: idea.marketSize,
        difficulty: idea.difficulty?.toString(),
        roadmap: idea.roadmap,
        metadata: { skills, interests, budget, availableTime, location, experience },
      }).returning()
      return saved
    }))

    res.json(saved)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', requireAuth, async (req, res) => {
  const user = (req as any).user
  const [idea] = await db.select().from(businessIdeas)
    .where(eq(businessIdeas.id, req.params.id))
  if (!idea || idea.userId !== user.id) return res.status(404).json({ error: 'Not found' })
  res.json(idea)
})

router.patch('/:id', requireAuth, async (req, res) => {
  const user = (req as any).user
  const [updated] = await db.update(businessIdeas)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(businessIdeas.id, req.params.id))
    .returning()
  res.json(updated)
})

router.delete('/:id', requireAuth, async (req, res) => {
  await db.delete(businessIdeas).where(eq(businessIdeas.id, req.params.id))
  res.json({ success: true })
})

export default router
