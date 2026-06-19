import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { db } from '../db/index.js'
import { socialPosts } from '../db/schema.js'
import { eq, desc, and } from 'drizzle-orm'
import { getAIProvider } from '../ai/index.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const posts = await db.select().from(socialPosts)
      .where(eq(socialPosts.userId, user.id))
      .orderBy(desc(socialPosts.createdAt))
    res.json(posts)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load posts' })
  }
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const { platform, content, hashtags, scheduledAt } = req.body
    if (!platform || !content) return res.status(400).json({ error: 'Platform and content are required' })
    const [post] = await db.insert(socialPosts).values({
      userId: user.id,
      platform,
      content,
      hashtags: hashtags || [],
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    }).returning()
    res.json(post)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create post' })
  }
})

router.post('/generate', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { platform, topic, tone, businessContext } = req.body
  if (!platform || !topic) return res.status(400).json({ error: 'Platform and topic are required' })

  const platformGuides: Record<string, string> = {
    linkedin: 'Professional tone, 1300 chars max, storytelling hook, industry insights, 3-5 hashtags',
    twitter: 'Punchy, max 280 chars, conversational, 1-2 hashtags, strong hook',
    instagram: 'Visual-first caption, emojis welcome, 30 hashtags max, call to action',
    tiktok: 'Gen Z friendly, trendy language, 150 chars, viral hook, 5-7 hashtags',
    facebook: 'Conversational, 500 chars, community-focused, question to drive comments',
  }

  const prompt = 'Write a ' + platform + ' post about: ' + topic + '\nTone: ' + (tone || 'professional and engaging') + '\nBusiness context: ' + (businessContext || 'startup founder sharing insights') + '\nPlatform guide: ' + (platformGuides[platform] || 'engaging and on-brand') + '\n\nReturn JSON: { "content": "post text", "hashtags": ["tag1", "tag2"] }'

  try {
    const ai = await getAIProvider()
    const response = await ai.generate(prompt, 'You are a social media expert. Return ONLY valid JSON.')

    let result = { content: '', hashtags: [] as string[] }
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) result = JSON.parse(jsonMatch[0])
    } catch {
      result = {
        content: '🚀 ' + topic + '\n\nAs a founder, I have learned that the best solutions come from real problems. Here is what I discovered...\n\n#startup #founder #entrepreneurship',
        hashtags: ['startup', 'founder', 'entrepreneurship'],
      }
    }

    const [post] = await db.insert(socialPosts).values({
      userId: user.id,
      platform: platform as any,
      content: result.content,
      hashtags: result.hashtags,
    }).returning()

    res.json(post)
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate post' })
  }
})

router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const { platform, content, hashtags, status, scheduledAt, publishedAt, mediaUrls, metrics } = req.body
    const updateData: any = { updatedAt: new Date() }
    if (platform !== undefined) updateData.platform = platform
    if (content !== undefined) updateData.content = content
    if (hashtags !== undefined) updateData.hashtags = hashtags
    if (status !== undefined) updateData.status = status
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null
    if (publishedAt !== undefined) updateData.publishedAt = publishedAt ? new Date(publishedAt) : null
    if (mediaUrls !== undefined) updateData.mediaUrls = mediaUrls
    if (metrics !== undefined) updateData.metrics = metrics

    const [updated] = await db.update(socialPosts)
      .set(updateData)
      .where(and(eq(socialPosts.id, req.params.id as string), eq(socialPosts.userId, user.id)))
      .returning()
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update post' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const result = await db.delete(socialPosts)
      .where(and(eq(socialPosts.id, req.params.id as string), eq(socialPosts.userId, user.id)))
      .returning({ id: socialPosts.id })
    if (result.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete post' })
  }
})

export default router
