import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { db } from '../db'
import { seoKeywords } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import { getAIProvider } from '../ai'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  const keywords = await db.select().from(seoKeywords)
    .where(eq(seoKeywords.userId, user.id))
    .orderBy(desc(seoKeywords.createdAt))
  res.json(keywords)
})

router.post('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { keyword, targetUrl, volume, difficulty, currentRank, targetRank, notes } = req.body
  const [kw] = await db.insert(seoKeywords).values({
    userId: user.id,
    keyword,
    targetUrl: targetUrl || null,
    volume: volume ? parseInt(volume) : null,
    difficulty: difficulty ? parseInt(difficulty) : null,
    currentRank: currentRank ? parseInt(currentRank) : null,
    targetRank: targetRank ? parseInt(targetRank) : null,
    notes: notes || null,
  }).returning()
  res.json(kw)
})

router.patch('/:id', requireAuth, async (req, res) => {
  const [updated] = await db.update(seoKeywords)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(seoKeywords.id, req.params.id))
    .returning()
  res.json(updated)
})

router.delete('/:id', requireAuth, async (req, res) => {
  await db.delete(seoKeywords).where(eq(seoKeywords.id, req.params.id))
  res.json({ success: true })
})

router.post('/suggest', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { niche, seedKeyword } = req.body

  const prompt = `Generate 10 SEO keyword ideas for a ${niche} business, starting from seed keyword: "${seedKeyword}".

For each keyword provide realistic estimates:
- keyword: the search term
- volume: monthly searches (number)
- difficulty: 0-100 (0=easy, 100=very hard)
- intent: informational/commercial/transactional/navigational

Focus on long-tail keywords with good opportunity (low difficulty, decent volume).

Return JSON array: [{ "keyword": "", "volume": 0, "difficulty": 0, "intent": "" }]`

  try {
    const ai = await getAIProvider()
    const response = await ai.generate(prompt, 'You are an SEO expert. Return ONLY valid JSON array.')

    let suggestions: any[] = []
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) suggestions = JSON.parse(jsonMatch[0])
    } catch {
      suggestions = [
        { keyword: `best ${seedKeyword} for startups`, volume: 1200, difficulty: 35, intent: 'commercial' },
        { keyword: `${seedKeyword} guide for founders`, volume: 800, difficulty: 28, intent: 'informational' },
        { keyword: `how to use ${seedKeyword}`, volume: 2100, difficulty: 42, intent: 'informational' },
        { keyword: `${seedKeyword} vs alternatives`, volume: 650, difficulty: 31, intent: 'commercial' },
        { keyword: `cheap ${seedKeyword}`, volume: 1800, difficulty: 55, intent: 'transactional' },
      ]
    }

    const saved = await Promise.all(suggestions.slice(0, 10).map(async (s: any) => {
      const [kw] = await db.insert(seoKeywords).values({
        userId: user.id,
        keyword: s.keyword,
        volume: s.volume || null,
        difficulty: s.difficulty || null,
        notes: s.intent ? `Intent: ${s.intent}` : null,
      }).returning()
      return kw
    }))

    res.json(saved)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/brief', requireAuth, async (req, res) => {
  const { keyword, targetAudience, businessContext } = req.body

  const prompt = `Create a detailed SEO content brief for the keyword: "${keyword}"
Target audience: ${targetAudience || 'startup founders'}
Business context: ${businessContext || 'SaaS startup'}

Include:
1. Title suggestions (3 options)
2. Meta description
3. Content outline with H2/H3 headings
4. Word count recommendation
5. Key points to cover
6. Internal linking opportunities
7. Related keywords to include

Return JSON: { "titles": [], "metaDescription": "", "outline": [], "wordCount": 0, "keyPoints": [], "relatedKeywords": [] }`

  try {
    const ai = await getAIProvider()
    const response = await ai.generate(prompt, 'You are an SEO content strategist. Return ONLY valid JSON.')

    let brief: any = {}
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) brief = JSON.parse(jsonMatch[0])
    } catch {
      brief = {
        titles: [`The Complete Guide to ${keyword}`, `How to Master ${keyword} in 2025`, `${keyword}: Everything You Need to Know`],
        metaDescription: `Learn everything about ${keyword}. Our comprehensive guide covers best practices, tips, and strategies for success.`,
        outline: ['Introduction', 'What is ' + keyword, 'Why it matters', 'How to get started', 'Best practices', 'Common mistakes', 'Conclusion'],
        wordCount: 2000,
        keyPoints: ['Define the topic clearly', 'Use real examples', 'Add statistics', 'Include actionable tips'],
        relatedKeywords: [keyword + ' guide', keyword + ' tips', keyword + ' examples'],
      }
    }

    res.json(brief)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
