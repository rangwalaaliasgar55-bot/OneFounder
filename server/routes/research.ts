import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { db } from '../db'
import { researchReports } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import { getAIProvider } from '../ai'
import { getWebContextString } from '../ai/webSearch'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user
  const reports = await db.select().from(researchReports)
    .where(eq(researchReports.userId, user.id))
    .orderBy(desc(researchReports.createdAt))
  res.json(reports)
})

router.post('/analyze', requireAuth, async (req, res) => {
  const user = (req as any).user
  const { niche, ideaId } = req.body
  if (!niche || typeof niche !== 'string') return res.status(400).json({ error: 'Niche required' })
  if (niche.length > 200) return res.status(400).json({ error: 'Niche too long (max 200 chars)' })

  try {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    // Fetch real-time web context in parallel before calling AI
    const [webContext, newsContext] = await Promise.all([
      getWebContextString(`${niche} market trends 2025 competitors`),
      getWebContextString(`${niche} startup industry news 2025`),
    ])

    const prompt = `Today is ${today}. Perform comprehensive market research for: "${niche}"

${webContext}

${newsContext}

Using the real-time data above AND your training knowledge, return ONLY valid JSON:
{
  "competitors": [{ "name": string, "website": string, "strengths": string[], "weaknesses": string[], "pricing": string }],
  "trends": [{ "trend": string, "impact": string, "timeframe": string }],
  "opportunities": [{ "opportunity": string, "rationale": string, "difficulty": string }],
  "keywords": [{ "keyword": string, "estimatedVolume": string, "intent": string }],
  "swot": { "strengths": string[], "weaknesses": string[], "opportunities": string[], "threats": string[] },
  "risks": [{ "risk": string, "mitigation": string, "severity": string }],
  "marketSize": { "tam": string, "sam": string, "som": string, "growthRate": string }
}
Include 5 competitors, 5 trends (cite real ones from web context), 5 opportunities, 10 keywords, full SWOT, 5 risks.`

    const ai = await getAIProvider()
    const response = await ai.generate(prompt, `You are a market research expert with access to real-time web data. Today is ${today}. Return ONLY valid JSON — no markdown, no explanation.`)

    let data: any = {}
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) data = JSON.parse(jsonMatch[0])
    } catch { data = {} }

    const [report] = await db.insert(researchReports).values({
      userId: user.id,
      ideaId: ideaId || null,
      title: `Market Research: ${niche}`,
      niche,
      competitors: data.competitors || [],
      swot: data.swot || {},
      trends: data.trends || [],
      opportunities: data.opportunities || [],
      keywords: data.keywords || [],
      risks: data.risks || [],
      fullReport: response,
    }).returning()

    res.json(report)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', requireAuth, async (req, res) => {
  const user = (req as any).user
  const [report] = await db.select().from(researchReports)
    .where(eq(researchReports.id, req.params.id as string))
  if (!report || report.userId !== user.id) return res.status(404).json({ error: 'Not found' })
  res.json(report)
})

router.delete('/:id', requireAuth, async (req, res) => {
  await db.delete(researchReports).where(eq(researchReports.id, req.params.id as string))
  res.json({ success: true })
})

export default router
