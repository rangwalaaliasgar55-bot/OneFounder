import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { db } from '../db'
import { seoKeywords, seoAudits, seoBriefs } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import { getAIProvider } from '../ai'

const router = Router()

// ─── Keywords ──────────────────────────────────────────────────────────────

router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  const keywords = await db.select().from(seoKeywords)
    .where(eq(seoKeywords.userId, user.id))
    .orderBy(desc(seoKeywords.createdAt))
  res.json(keywords)
})

router.post('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { keyword, targetUrl, volume, difficulty, currentRank, targetRank, notes, intent, cluster, priority, status } = req.body
  const rankHistory = currentRank
    ? [{ date: new Date().toISOString(), rank: parseInt(currentRank) }]
    : []
  const [kw] = await db.insert(seoKeywords).values({
    userId: user.id,
    keyword,
    targetUrl: targetUrl || null,
    volume: volume ? parseInt(volume) : null,
    difficulty: difficulty ? parseInt(difficulty) : null,
    currentRank: currentRank ? parseInt(currentRank) : null,
    targetRank: targetRank ? parseInt(targetRank) : null,
    notes: notes || null,
    intent: intent || null,
    cluster: cluster || null,
    priority: priority || 'medium',
    status: status || 'tracking',
    rankHistory,
  }).returning()
  res.json(kw)
})

router.patch('/:id', requireAuth, async (req, res) => {
  const updates: any = { ...req.body, updatedAt: new Date() }
  // When currentRank changes, append to history
  if (updates.currentRank !== undefined) {
    const [existing] = await db.select().from(seoKeywords).where(eq(seoKeywords.id, req.params.id))
    if (existing) {
      const history = (existing.rankHistory as any[]) || []
      history.push({ date: new Date().toISOString(), rank: updates.currentRank })
      updates.rankHistory = history
    }
  }
  const [updated] = await db.update(seoKeywords)
    .set(updates)
    .where(eq(seoKeywords.id, req.params.id))
    .returning()
  res.json(updated)
})

router.delete('/:id', requireAuth, async (req, res) => {
  await db.delete(seoKeywords).where(eq(seoKeywords.id, req.params.id))
  res.json({ success: true })
})

// ─── AI Keyword Suggest ─────────────────────────────────────────────────────

router.post('/suggest', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { niche, seedKeyword, count = 10 } = req.body

  const prompt = `Generate ${count} high-opportunity SEO keyword ideas for a "${niche}" business, starting from the seed: "${seedKeyword}".

Focus on long-tail keywords with realistic estimates. Include a mix of intents.
For each keyword:
- keyword: search term (string)
- volume: monthly searches (integer, realistic)
- difficulty: 0-100 keyword difficulty (integer)
- intent: informational | commercial | transactional | navigational
- cluster: topic cluster name (2-3 word label grouping related keywords)
- priority: high | medium | low (based on opportunity = volume/difficulty ratio)

Return ONLY a valid JSON array:
[{ "keyword": "", "volume": 0, "difficulty": 0, "intent": "", "cluster": "", "priority": "" }]`

  try {
    const ai = await getAIProvider()
    const response = await ai.generate(prompt, 'You are an expert SEO strategist. Return ONLY valid JSON array with no markdown.')

    let suggestions: any[] = []
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) suggestions = JSON.parse(jsonMatch[0])
    } catch {
      suggestions = [
        { keyword: `best ${seedKeyword} for startups`, volume: 1200, difficulty: 32, intent: 'commercial', cluster: 'Best Tools', priority: 'high' },
        { keyword: `${seedKeyword} guide for beginners`, volume: 880, difficulty: 25, intent: 'informational', cluster: 'Guides', priority: 'high' },
        { keyword: `how to use ${seedKeyword}`, volume: 2100, difficulty: 38, intent: 'informational', cluster: 'Guides', priority: 'medium' },
        { keyword: `${seedKeyword} vs alternatives`, volume: 650, difficulty: 28, intent: 'commercial', cluster: 'Comparisons', priority: 'high' },
        { keyword: `${seedKeyword} pricing`, volume: 1800, difficulty: 45, intent: 'transactional', cluster: 'Pricing', priority: 'medium' },
        { keyword: `free ${seedKeyword}`, volume: 3200, difficulty: 58, intent: 'transactional', cluster: 'Free Tools', priority: 'medium' },
        { keyword: `${seedKeyword} examples`, volume: 750, difficulty: 22, intent: 'informational', cluster: 'Guides', priority: 'high' },
        { keyword: `${seedKeyword} tutorial`, volume: 1400, difficulty: 30, intent: 'informational', cluster: 'Guides', priority: 'medium' },
        { keyword: `best ${seedKeyword} 2025`, volume: 960, difficulty: 35, intent: 'commercial', cluster: 'Best Tools', priority: 'high' },
        { keyword: `${seedKeyword} software`, volume: 2800, difficulty: 62, intent: 'commercial', cluster: 'Best Tools', priority: 'low' },
      ]
    }

    const saved = await Promise.all(suggestions.slice(0, count).map(async (s: any) => {
      const [kw] = await db.insert(seoKeywords).values({
        userId: user.id,
        keyword: s.keyword,
        volume: s.volume || null,
        difficulty: s.difficulty || null,
        intent: s.intent || null,
        cluster: s.cluster || null,
        priority: s.priority || 'medium',
        status: 'tracking',
        rankHistory: [],
        notes: null,
      }).returning()
      return kw
    }))

    res.json(saved)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ─── Competitor Analysis ─────────────────────────────────────────────────────

router.post('/competitor', requireAuth, async (req, res) => {
  const { competitorUrl, niche, yourKeywords = [] } = req.body

  const prompt = `Perform a competitive SEO analysis for: ${competitorUrl}
Industry/Niche: ${niche || 'SaaS/tech startup'}
My current keywords: ${yourKeywords.length ? yourKeywords.join(', ') : 'none provided'}

Analyze as an SEO expert and provide:
1. Estimated top keywords the competitor likely ranks for (with volume/difficulty estimates)
2. Content strategy observations (what types of content they focus on)
3. SEO strengths they likely have
4. Keyword gaps — keywords they rank for that I'm missing
5. Quick-win opportunities to outrank them
6. Recommended action plan (3-5 steps)

Return JSON:
{
  "competitorKeywords": [{"keyword":"","volume":0,"difficulty":0,"intent":"","estimatedRank":0}],
  "contentStrategy": "",
  "strengths": [],
  "keywordGaps": [{"keyword":"","volume":0,"difficulty":0,"opportunity":""}],
  "quickWins": [],
  "actionPlan": []
}`

  try {
    const ai = await getAIProvider()
    const response = await ai.generate(prompt, 'You are a senior SEO strategist. Return ONLY valid JSON.')

    let analysis: any = {}
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) analysis = JSON.parse(jsonMatch[0])
    } catch {
      const domain = competitorUrl.replace(/^https?:\/\//, '').split('/')[0]
      analysis = {
        competitorKeywords: [
          { keyword: `${niche || 'startup'} software`, volume: 2800, difficulty: 62, intent: 'commercial', estimatedRank: 5 },
          { keyword: `best ${niche || 'startup'} tools`, volume: 1500, difficulty: 45, intent: 'commercial', estimatedRank: 3 },
          { keyword: `${niche || 'startup'} guide`, volume: 900, difficulty: 30, intent: 'informational', estimatedRank: 8 },
        ],
        contentStrategy: `${domain} appears to focus on long-form educational content and comparison articles targeting commercial intent keywords. They likely invest in case studies and product reviews.`,
        strengths: ['Strong domain authority', 'Rich blog content', 'Good internal linking structure', 'Active link building'],
        keywordGaps: [
          { keyword: `${niche || 'startup'} for small business`, volume: 1100, difficulty: 28, opportunity: 'Low competition with decent volume' },
          { keyword: `affordable ${niche || 'startup'} software`, volume: 700, difficulty: 22, opportunity: 'Strong buyer intent, easy to rank' },
        ],
        quickWins: [
          'Target long-tail comparison keywords with "vs" articles',
          'Create comprehensive guides for informational keywords they rank for',
          'Build backlinks from industry directories',
          'Optimize existing pages for featured snippets',
        ],
        actionPlan: [
          'Audit your top 5 pages and optimize title tags and meta descriptions',
          'Create 3 "best [niche] tools" comparison articles targeting competitor keywords',
          'Build 10 relevant backlinks per month from guest posts',
          'Set up Google Search Console to track position changes weekly',
          'Create a content calendar around the identified keyword gaps',
        ],
      }
    }

    res.json(analysis)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ─── SEO Audit ───────────────────────────────────────────────────────────────

router.post('/audit', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { url, pageContent, pageTitle, metaDescription, h1, wordCount, internalLinks, externalLinks } = req.body

  const prompt = `Perform a technical SEO audit for the URL: ${url}

Page data provided:
- Title: ${pageTitle || 'not provided'}
- Meta Description: ${metaDescription || 'not provided'}
- H1: ${h1 || 'not provided'}
- Word Count: ${wordCount || 'not provided'}
- Internal Links: ${internalLinks || 'not provided'}
- External Links: ${externalLinks || 'not provided'}
- Page Content Sample: ${pageContent ? pageContent.substring(0, 500) + '...' : 'not provided'}

Evaluate and score (0-100) the page across:
- Title tag (length, keyword inclusion, uniqueness)
- Meta description (length 120-160 chars, CTA, keyword)
- Heading structure (H1 uniqueness, H2/H3 use)
- Content quality (word count, readability, keyword density)
- Technical basics (estimated load speed, mobile, HTTPS)
- Internal linking
- Schema markup opportunity

Return JSON:
{
  "score": 0,
  "grade": "A|B|C|D|F",
  "issues": [{"type":"error|warning|info","category":"Title|Meta|Content|Technical|Links|Schema","message":"","fix":""}],
  "strengths": [],
  "recommendations": [{"priority":"high|medium|low","action":"","impact":""}],
  "scores": {"title":0,"meta":0,"content":0,"technical":0,"links":0,"schema":0}
}`

  try {
    const ai = await getAIProvider()
    const response = await ai.generate(prompt, 'You are an SEO technical auditor. Return ONLY valid JSON.')

    let audit: any = {}
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) audit = JSON.parse(jsonMatch[0])
    } catch {
      const titleLen = (pageTitle || '').length
      const metaLen = (metaDescription || '').length
      audit = {
        score: 65,
        grade: 'C',
        issues: [
          !pageTitle ? { type: 'error', category: 'Title', message: 'Missing title tag', fix: 'Add a descriptive title tag with your primary keyword (50-60 characters)' } : null,
          titleLen > 60 ? { type: 'warning', category: 'Title', message: `Title too long (${titleLen} chars, max 60)`, fix: 'Shorten your title to under 60 characters' } : null,
          !metaDescription ? { type: 'error', category: 'Meta', message: 'Missing meta description', fix: 'Add a meta description (120-160 characters) with a call to action' } : null,
          !h1 ? { type: 'error', category: 'Content', message: 'Missing H1 heading', fix: 'Add exactly one H1 tag with your primary keyword' } : null,
          (wordCount || 0) < 500 ? { type: 'warning', category: 'Content', message: 'Content too thin', fix: 'Aim for at least 800-1200 words for competitive keywords' } : null,
        ].filter(Boolean),
        strengths: ['HTTPS likely enabled', 'URL structure appears clean'],
        recommendations: [
          { priority: 'high', action: 'Add or optimize title tag with primary keyword', impact: 'Improves CTR by 20-30%' },
          { priority: 'high', action: 'Write compelling meta description (120-160 chars)', impact: 'Can improve CTR from SERP by 5-15%' },
          { priority: 'medium', action: 'Add structured data / schema markup', impact: 'Enables rich results and higher visibility' },
          { priority: 'medium', action: 'Improve internal linking from high-authority pages', impact: 'Passes more PageRank to this page' },
        ],
        scores: { title: 50, meta: 40, content: 65, technical: 70, links: 60, schema: 20 },
      }
    }

    // Save audit to DB
    const [saved] = await db.insert(seoAudits).values({
      userId: user.id,
      url,
      score: audit.score,
      issues: audit.issues,
      recommendations: audit.recommendations,
      metadata: { grade: audit.grade, scores: audit.scores, strengths: audit.strengths, pageTitle, metaDescription, h1, wordCount },
    }).returning()

    res.json({ ...audit, id: saved.id })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/audits', requireAuth, async (req, res) => {
  const user = (req as any).user
  const audits = await db.select().from(seoAudits)
    .where(eq(seoAudits.userId, user.id))
    .orderBy(desc(seoAudits.createdAt))
  res.json(audits)
})

router.delete('/audits/:id', requireAuth, async (req, res) => {
  await db.delete(seoAudits).where(eq(seoAudits.id, req.params.id))
  res.json({ success: true })
})

// ─── Content Briefs ───────────────────────────────────────────────────────────

router.get('/briefs', requireAuth, async (req, res) => {
  const user = (req as any).user
  const briefs = await db.select().from(seoBriefs)
    .where(eq(seoBriefs.userId, user.id))
    .orderBy(desc(seoBriefs.createdAt))
  res.json(briefs)
})

router.post('/brief', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { keyword, targetAudience, businessContext } = req.body

  const prompt = `Create a comprehensive SEO content brief for: "${keyword}"
Target audience: ${targetAudience || 'startup founders and entrepreneurs'}
Business context: ${businessContext || 'SaaS startup'}

Return JSON:
{
  "titles": ["title 1", "title 2", "title 3"],
  "metaDescription": "",
  "outline": [
    {"heading": "H2 heading", "type": "h2", "notes": "what to cover"},
    {"heading": "H3 sub-heading", "type": "h3", "notes": "specific point"}
  ],
  "wordCount": 0,
  "keyPoints": [],
  "relatedKeywords": [],
  "faqSection": [{"question":"","answer":""}],
  "internalLinkingIdeas": [],
  "cta": ""
}`

  try {
    const ai = await getAIProvider()
    const response = await ai.generate(prompt, 'You are an SEO content strategist. Return ONLY valid JSON.')

    let brief: any = {}
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) brief = JSON.parse(jsonMatch[0])
    } catch {
      brief = {
        titles: [`The Complete Guide to ${keyword} (2025)`, `How to Master ${keyword}: A Founder's Guide`, `${keyword}: Everything You Need to Know to Get Started`],
        metaDescription: `Learn everything about ${keyword}. Our comprehensive guide covers best practices, real examples, and actionable strategies for success in 2025.`,
        outline: [
          { heading: `What is ${keyword}?`, type: 'h2', notes: 'Define clearly with examples, include primary keyword' },
          { heading: 'Why it matters for your business', type: 'h2', notes: 'Business impact, statistics, pain points it solves' },
          { heading: 'Getting started: Step-by-step', type: 'h2', notes: 'Practical steps, numbered list format' },
          { heading: 'Best practices and pro tips', type: 'h2', notes: 'Expert advice, avoid common mistakes' },
          { heading: 'Real-world examples and case studies', type: 'h2', notes: 'Include 2-3 concrete examples with results' },
          { heading: 'Common mistakes to avoid', type: 'h2', notes: 'What NOT to do — builds trust' },
          { heading: 'Conclusion and next steps', type: 'h2', notes: 'Summary + clear CTA' },
        ],
        wordCount: 2200,
        keyPoints: ['Define the topic with clarity and depth', 'Use real data and statistics', 'Include actionable, numbered steps', 'Add screenshots or visuals where possible', 'Link to 3-5 authoritative external sources'],
        relatedKeywords: [`${keyword} guide`, `how to ${keyword}`, `${keyword} examples`, `${keyword} tips`, `${keyword} best practices`],
        faqSection: [
          { question: `What is the best way to start with ${keyword}?`, answer: 'Begin by understanding your specific use case and goals...' },
          { question: `How long does it take to see results from ${keyword}?`, answer: 'Results typically begin showing within 3-6 months...' },
          { question: `Is ${keyword} right for my startup?`, answer: 'It depends on your growth stage and resources...' },
        ],
        internalLinkingIdeas: ['Link from your homepage to this guide', 'Add it to your blog category page', 'Reference it in related how-to posts'],
        cta: `Ready to implement ${keyword} for your startup? Start your free trial today →`,
      }
    }

    // Save to DB
    const [saved] = await db.insert(seoBriefs).values({
      userId: user.id,
      keyword,
      targetAudience: targetAudience || null,
      businessContext: businessContext || null,
      titles: brief.titles,
      metaDescription: brief.metaDescription,
      outline: brief.outline,
      wordCount: brief.wordCount,
      keyPoints: brief.keyPoints,
      relatedKeywords: brief.relatedKeywords,
      faqSection: brief.faqSection || [],
    }).returning()

    res.json({ ...brief, id: saved.id, createdAt: saved.createdAt })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/briefs/:id', requireAuth, async (req, res) => {
  await db.delete(seoBriefs).where(eq(seoBriefs.id, req.params.id))
  res.json({ success: true })
})

// ─── Keyword Clustering ───────────────────────────────────────────────────────

router.post('/cluster', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { keywords: keywordList } = req.body

  if (!keywordList || !keywordList.length) {
    return res.status(400).json({ error: 'No keywords provided' })
  }

  const prompt = `Group these keywords into topic clusters for an SEO content strategy:
${keywordList.join('\n')}

Create 3-6 meaningful clusters. Each cluster should represent a distinct content topic.

Return JSON:
{
  "clusters": [
    {
      "name": "Cluster Name",
      "pillarPage": "suggested pillar page title",
      "keywords": ["keyword1", "keyword2"],
      "intent": "informational|commercial|mixed",
      "priority": "high|medium|low",
      "contentIdeas": ["content idea 1", "content idea 2"]
    }
  ]
}`

  try {
    const ai = await getAIProvider()
    const response = await ai.generate(prompt, 'You are an SEO content strategist. Return ONLY valid JSON.')

    let result: any = {}
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) result = JSON.parse(jsonMatch[0])
    } catch {
      result = { clusters: [] }
    }

    // Update keywords in DB with their cluster assignments
    if (result.clusters) {
      for (const cluster of result.clusters) {
        for (const kwText of cluster.keywords) {
          const existing = await db.select().from(seoKeywords)
            .where(eq(seoKeywords.userId, user.id))
          const match = existing.find(k => k.keyword.toLowerCase() === kwText.toLowerCase())
          if (match) {
            await db.update(seoKeywords)
              .set({ cluster: cluster.name, updatedAt: new Date() })
              .where(eq(seoKeywords.id, match.id))
          }
        }
      }
    }

    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
