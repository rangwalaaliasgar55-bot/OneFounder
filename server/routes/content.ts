import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { db } from '../db/index.js'
import { contentPieces } from '../db/schema.js'
import { eq, desc, and } from 'drizzle-orm'
import { getAIProvider } from '../ai/index.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const list = await db.select().from(contentPieces)
      .where(eq(contentPieces.userId, user.id))
      .orderBy(desc(contentPieces.createdAt))
    res.json(list)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load content' })
  }
})

router.post('/generate', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { type, topic, tone, audience, keywords } = req.body
  if (!topic) return res.status(400).json({ error: 'Topic is required' })

  const prompts: Record<string, string> = {
    blog: 'Write a comprehensive, SEO-optimized blog post about "' + topic + '" for ' + (audience || 'general audience') + '. Include: engaging title, introduction, 5 main sections with subheadings, conclusion, and call-to-action. Tone: ' + (tone || 'professional') + '. Target keywords: ' + (keywords || topic),
    linkedin: 'Write a compelling LinkedIn post about "' + topic + '". Make it personal, insightful, and engaging. Include a hook, main content, key takeaway, and 3-5 relevant hashtags. Tone: ' + (tone || 'thought leadership'),
    twitter: 'Write a Twitter/X thread about "' + topic + '" with 8-10 tweets. Start with a hook tweet, develop the idea, end with a call to action. Each tweet max 280 chars.',
    newsletter: 'Write a newsletter issue about "' + topic + '" for ' + (audience || 'founders and entrepreneurs') + '. Include: catchy subject line, personal intro, main content, actionable tips, and sign-off.',
    email: 'Write a professional email about "' + topic + '". Include: subject line, personalized greeting, clear message, CTA, signature.',
    landing_page: 'Write compelling landing page copy for "' + topic + '". Include: hero headline, subheadline, 3 key benefits, social proof section, FAQ, and CTA.',
    ad_copy: 'Write 5 ad copy variations for "' + topic + '". Each should have: headline, body text, and CTA. Optimize for ' + (audience || 'conversion') + '.',
    product_description: 'Write an engaging product description for "' + topic + '". Highlight features, benefits, and use cases. Make it persuasive and SEO-friendly.',
  }

  const prompt = prompts[type] || prompts.blog

  try {
    const ai = await getAIProvider()
    const content = await ai.generate(prompt, 'You are an expert copywriter and content strategist. Create high-quality, engaging content that converts.')

    const [piece] = await db.insert(contentPieces).values({
      userId: user.id,
      title: type.replace('_', ' ').toUpperCase() + ': ' + topic,
      type: type as any,
      content,
      prompt,
      status: 'draft',
      tags: keywords ? keywords.split(',').map((k: string) => k.trim()) : [],
      metadata: { tone, audience, keywords },
    }).returning()

    res.json(piece)
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate content' })
  }
})

router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const { title, content, type, status, tags, metadata, scheduledAt, publishedAt } = req.body
    const updateData: any = { updatedAt: new Date() }
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (type !== undefined) updateData.type = type
    if (status !== undefined) updateData.status = status
    if (tags !== undefined) updateData.tags = tags
    if (metadata !== undefined) updateData.metadata = metadata
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null
    if (publishedAt !== undefined) updateData.publishedAt = publishedAt ? new Date(publishedAt) : null

    const [updated] = await db.update(contentPieces)
      .set(updateData)
      .where(and(eq(contentPieces.id, req.params.id as string), eq(contentPieces.userId, user.id)))
      .returning()
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update content' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const result = await db.delete(contentPieces)
      .where(and(eq(contentPieces.id, req.params.id as string), eq(contentPieces.userId, user.id)))
      .returning({ id: contentPieces.id })
    if (result.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete content' })
  }
})

router.post('/repurpose', requireAuth, async (req, res) => {
  const { sourceContent, sourceTopic, sourceType, platforms, tone, audience } = req.body
  if (!sourceTopic && !sourceContent) return res.status(400).json({ error: 'Source topic or content is required' })

  const requestedPlatforms = platforms || ['linkedin', 'twitter', 'newsletter']

  const prompt = 'You are a world-class content repurposing expert.
Original content topic: "' + (sourceTopic || 'the provided content') + '"
Source type: ' + (sourceType || 'blog post') + '
Target audience: ' + (audience || 'startup founders') + '
Tone: ' + (tone || 'professional and engaging') + '

' + (sourceContent ? 'Original content:
---
' + sourceContent.substring(0, 1500) + '
---
' : '') + '
Repurpose this content for multiple platforms. Return JSON with ' + requestedPlatforms.join(', ') + ' keys, each having content and tips fields.'

  try {
    const ai = await getAIProvider()
    const response = await ai.generate(prompt, 'You are an expert content repurposer. Return ONLY valid JSON.')
    let repurposed: any = {}
    try { const m = response.match(/\{[\s\S]*\}/); if (m) repurposed = JSON.parse(m[0]) } catch {}

    for (const platform of requestedPlatforms) {
      if (!repurposed[platform]) {
        const topic = sourceTopic || 'this topic'
        repurposed[platform] = {
          content: 'Content repurposed for ' + platform + ': ' + topic,
          tips: 'Optimize your ' + platform + ' content by posting at peak hours and engaging with comments.',
        }
      }
    }

    res.json(repurposed)
  } catch (error: any) { res.status(500).json({ error: error.message || 'Failed to repurpose content' }) }
})

export default router
