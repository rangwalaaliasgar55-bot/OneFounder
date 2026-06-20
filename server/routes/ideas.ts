import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { IdeaGenerateSchema, IdeaUpdateSchema } from '../middleware/schemas.js'
import { db } from '../db/index.js'
import { businessIdeas } from '../db/schema.js'
import { eq, desc, and } from 'drizzle-orm'
import { getAIProvider } from '../ai/index.js'
import { getWebContextString } from '../ai/webSearch.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const ideas = await db.select().from(businessIdeas)
      .where(eq(businessIdeas.userId, user.id))
      .orderBy(desc(businessIdeas.createdAt))
    res.json(ideas)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load ideas' })
  }
})

router.post('/generate', requireAuth, validate(IdeaGenerateSchema), async (req, res) => {
  const user = (req as any).user
  const { skills, interests, budget, availableTime, location, experience } = req.body

  try {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const topic = interests || skills || 'technology startups'

    const webContext = await getWebContextString(`${topic} startup trends 2026 business opportunities`)

    const prompt = `Today is ${today}. Generate 5 unique, fundable business ideas for a founder with this profile:
- Skills: ${skills || 'general'}
- Interests: ${interests || 'technology'}
- Budget: ${budget || '$1,000-$10,000'}
- Available Time: ${availableTime || '10-20 hours/week'}
- Location: ${location || 'Remote/Global'}
- Experience: ${experience || 'Beginner'}

${webContext}

Use the real-time trends above to make the ideas current and relevant. Return ONLY a JSON array:
[{
  "title": string,
  "type": "SaaS|Agency|Marketplace|AI|Local Business|Creator",
  "description": string (2-3 sentences, specific and compelling),
  "competition": "Low|Medium|High",
  "revenuePotential": string (monthly range),
  "marketSize": string,
  "difficulty": number (1-10),
  "whyNow": string (1 sentence — why this is the right moment for this idea),
  "roadmap": { "day30": string, "day60": string, "day90": string }
}]`

    const ai = await getAIProvider()
    const response = await ai.generate(prompt, `You are an expert startup advisor who knows what is trending right now (today is ${today}). Return ONLY valid JSON array.`)

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
    res.status(500).json({ error: error.message || 'Failed to generate ideas' })
  }
})

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const [idea] = await db.select().from(businessIdeas)
      .where(eq(businessIdeas.id, req.params.id as string))
    if (!idea || idea.userId !== user.id) return res.status(404).json({ error: 'Not found' })
    res.json(idea)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load idea' })
  }
})

router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const { title, description, type, status, competition, revenuePotential, marketSize, difficulty, roadmap, metadata } = req.body
    const updateData: any = { updatedAt: new Date() }
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (type !== undefined) updateData.type = type
    if (status !== undefined) updateData.status = status
    if (competition !== undefined) updateData.competition = competition
    if (revenuePotential !== undefined) updateData.revenuePotential = revenuePotential
    if (marketSize !== undefined) updateData.marketSize = marketSize
    if (difficulty !== undefined) updateData.difficulty = difficulty
    if (roadmap !== undefined) updateData.roadmap = roadmap
    if (metadata !== undefined) updateData.metadata = metadata

    const [updated] = await db.update(businessIdeas)
      .set(updateData)
      .where(and(eq(businessIdeas.id, req.params.id as string), eq(businessIdeas.userId, user.id)))
      .returning()
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update idea' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const result = await db.delete(businessIdeas)
      .where(and(eq(businessIdeas.id, req.params.id as string), eq(businessIdeas.userId, user.id)))
      .returning({ id: businessIdeas.id })
    if (result.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete idea' })
  }
})

export default router
