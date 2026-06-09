import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { db } from '../db'
import { contentPieces } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import { getAIProvider } from '../ai'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  const list = await db.select().from(contentPieces)
    .where(eq(contentPieces.userId, user.id))
    .orderBy(desc(contentPieces.createdAt))
  res.json(list)
})

router.post('/generate', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { type, topic, tone, audience, keywords } = req.body

  const prompts: Record<string, string> = {
    blog: `Write a comprehensive, SEO-optimized blog post about "${topic}" for ${audience || 'general audience'}. Include: engaging title, introduction, 5 main sections with subheadings, conclusion, and call-to-action. Tone: ${tone || 'professional'}. Target keywords: ${keywords || topic}`,
    linkedin: `Write a compelling LinkedIn post about "${topic}". Make it personal, insightful, and engaging. Include a hook, main content, key takeaway, and 3-5 relevant hashtags. Tone: ${tone || 'thought leadership'}`,
    twitter: `Write a Twitter/X thread about "${topic}" with 8-10 tweets. Start with a hook tweet, develop the idea, end with a call to action. Each tweet max 280 chars.`,
    newsletter: `Write a newsletter issue about "${topic}" for ${audience || 'founders and entrepreneurs'}. Include: catchy subject line, personal intro, main content, actionable tips, and sign-off.`,
    email: `Write a professional email about "${topic}". Include: subject line, personalized greeting, clear message, CTA, signature.`,
    landing_page: `Write compelling landing page copy for "${topic}". Include: hero headline, subheadline, 3 key benefits, social proof section, FAQ, and CTA.`,
    ad_copy: `Write 5 ad copy variations for "${topic}". Each should have: headline, body text, and CTA. Optimize for ${audience || 'conversion'}.`,
    product_description: `Write an engaging product description for "${topic}". Highlight features, benefits, and use cases. Make it persuasive and SEO-friendly.`,
  }

  const prompt = prompts[type] || prompts.blog

  try {
    const ai = await getAIProvider()
    const content = await ai.generate(prompt, `You are an expert copywriter and content strategist. Create high-quality, engaging content that converts.`)

    const [piece] = await db.insert(contentPieces).values({
      userId: user.id,
      title: `${type.replace('_', ' ').toUpperCase()}: ${topic}`,
      type: type as any,
      content,
      prompt,
      status: 'draft',
      tags: keywords ? keywords.split(',').map((k: string) => k.trim()) : [],
      metadata: { tone, audience, keywords },
    }).returning()

    res.json(piece)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.patch('/:id', requireAuth, async (req, res) => {
  const [updated] = await db.update(contentPieces)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(contentPieces.id, req.params.id))
    .returning()
  res.json(updated)
})

router.delete('/:id', requireAuth, async (req, res) => {
  await db.delete(contentPieces).where(eq(contentPieces.id, req.params.id))
  res.json({ success: true })
})

export default router
