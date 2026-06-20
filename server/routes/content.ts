import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { ContentCreateSchema, ContentRepurposeSchema } from '../middleware/schemas.js'
import { db } from '../db/index.js'
import { contentPieces } from '../db/schema.js'
import { eq, desc, and } from 'drizzle-orm'
import { getAIProvider } from '../ai/index.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  const list = await db.select().from(contentPieces)
    .where(eq(contentPieces.userId, user.id))
    .orderBy(desc(contentPieces.createdAt))
  res.json(list)
})

router.post('/generate', requireAuth, validate(ContentCreateSchema), async (req, res) => {
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
  const user = (req as any).user
  const [updated] = await db.update(contentPieces)
    .set({ ...req.body, updatedAt: new Date() })
    .where(and(eq(contentPieces.id, req.params.id as string), eq(contentPieces.userId, user.id)))
    .returning()
  if (!updated) return res.status(404).json({ error: 'Not found' })
  res.json(updated)
})

router.delete('/:id', requireAuth, async (req, res) => {
  const user = (req as any).user
  await db.delete(contentPieces)
    .where(and(eq(contentPieces.id, req.params.id as string), eq(contentPieces.userId, user.id)))
  res.json({ success: true })
})

// ─── Multi-Platform Repurposer ────────────────────────────────────────────────

router.post('/repurpose', requireAuth, async (req, res) => {
  const { sourceContent, sourceTopic, sourceType, platforms, tone, audience } = req.body

  const platformPrompts: Record<string, string> = {
    linkedin: `Create an engaging LinkedIn post from this content. Include a strong hook, 3-4 key insights, personal perspective, and 3-5 hashtags. Professional yet personable tone. Max 1300 chars.`,
    twitter: `Create an X/Twitter thread (6-8 tweets) from this content. Start with a hook tweet that makes people want to read more. Each tweet max 280 chars. End with a CTA.`,
    newsletter: `Create a newsletter section from this content. Include: punchy subject line, intro paragraph, 3 key takeaways in bullet format, and a closing insight. Conversational tone.`,
    instagram: `Create an Instagram carousel from this content. Write: slide 1 (hook/title), slides 2-6 (one key point each, short text + visual description), slide 7 (CTA/summary). Include 10-15 hashtags.`,
    youtube: `Create a YouTube video script outline from this content. Include: hook (0-30s), intro (30-60s), 3-4 main sections with talking points, outro with CTA. Total 5-8 minutes runtime.`,
    podcast: `Create a podcast episode outline from this content. Include: episode title, teaser (30s), intro, 3 discussion segments with questions, guest talking points, and outro. 20-30 min episode.`,
  }

  const requestedPlatforms = platforms || ['linkedin', 'twitter', 'newsletter']

  const prompt = `You are a world-class content repurposing expert. 
Original content topic: "${sourceTopic || 'the provided content'}"
Source type: ${sourceType || 'blog post'}
Target audience: ${audience || 'startup founders'}
Tone: ${tone || 'professional and engaging'}

${sourceContent ? `Original content:\n---\n${sourceContent.substring(0, 1500)}\n---\n` : ''}

Repurpose this content for multiple platforms. For each platform requested, adapt the format, tone, and structure perfectly for that platform's audience and algorithm.

Return JSON:
{
  ${requestedPlatforms.map((p: string) => `"${p}": {"content": "", "tips": ""}`).join(',\n  ')}
}`

  try {
    const ai = await getAIProvider()
    const response = await ai.generate(prompt, 'You are an expert content repurposer. Return ONLY valid JSON.')
    let repurposed: any = {}
    try { const m = response.match(/\{[\s\S]*\}/); if (m) repurposed = JSON.parse(m[0]) } catch {}

    // Ensure all requested platforms have content
    for (const platform of requestedPlatforms) {
      if (!repurposed[platform]) {
        const topic = sourceTopic || 'this topic'
        repurposed[platform] = {
          content: platform === 'linkedin'
            ? `🚀 Key insight about ${topic}:\n\nAfter diving deep into this, here's what I've learned:\n\n• The fundamentals matter more than tactics\n• Consistency compounds over time\n• Start before you're ready\n\nWhat's your experience with this?\n\n#startup #founder #growth`
            : platform === 'twitter'
            ? `Thread: Everything you need to know about ${topic} 🧵\n\n1/ Most people get this wrong...\n\n2/ Here's the key insight:\n\n3/ What this means for you:\n\n4/ Action step for today:\n\n5/ Bottom line: start now.\n\nRT if this helped 🙏`
            : platform === 'newsletter'
            ? `Subject: The ${topic} insight I wish I had earlier\n\n---\n\nHey Founder,\n\nThis week I want to share something that changed how I think about ${topic}.\n\nKey takeaway 1: Start with fundamentals\nKey takeaway 2: Consistency beats perfection\nKey takeaway 3: Data > opinions\n\nHope this helps,\n[Your Name]`
            : `Content repurposed for ${platform}: ${topic}`,
          tips: `Optimize your ${platform} content by posting at peak hours and engaging with comments.`,
        }
      }
    }

    res.json(repurposed)
  } catch (error: any) { res.status(500).json({ error: error.message }) }
})

export default router
