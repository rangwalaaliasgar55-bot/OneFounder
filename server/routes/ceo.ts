import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { db } from '../db'
import { seoKeywords, financeEntries, contentPieces, leads, tasks, businessIdeas, backlinks, seoAudits, socialPosts } from '../db/schema'
import { eq, desc, gte } from 'drizzle-orm'
import { getAIProvider } from '../ai'

const router = Router()

// ─── Business Health Score ────────────────────────────────────────────────────

router.get('/health-score', requireAuth, async (req, res) => {
  const user = (req as any).user
  const uid = user.id

  try {
    const [allKeywords, allFinance, allContent, allLeads, allTasks, allIdeas, allBacklinks, allAudits, allSocial] = await Promise.all([
      db.select().from(seoKeywords).where(eq(seoKeywords.userId, uid)),
      db.select().from(financeEntries).where(eq(financeEntries.userId, uid)),
      db.select().from(contentPieces).where(eq(contentPieces.userId, uid)),
      db.select().from(leads).where(eq(leads.userId, uid)),
      db.select().from(tasks).where(eq(tasks.userId, uid)),
      db.select().from(businessIdeas).where(eq(businessIdeas.userId, uid)),
      db.select().from(backlinks).where(eq(backlinks.userId, uid)),
      db.select().from(seoAudits).where(eq(seoAudits.userId, uid)),
      db.select().from(socialPosts).where(eq(socialPosts.userId, uid)),
    ])

    // ─── Score Calculations (each 0-100, weighted) ───────────────────────
    // Revenue (20 pts)
    const revenue = allFinance.filter(f => f.type === 'revenue').reduce((s, f) => s + f.amount, 0)
    const mrr = allFinance.filter(f => f.type === 'subscription' && f.recurring).reduce((s, f) => s + f.amount, 0)
    const revenueScore = Math.min(100, Math.round((mrr > 0 ? 60 : 0) + Math.min(40, revenue / 500)))

    // SEO (20 pts)
    const top10 = allKeywords.filter(k => k.currentRank && k.currentRank <= 10).length
    const totalVol = allKeywords.reduce((s, k) => s + (k.volume || 0), 0)
    const avgAuditScore = allAudits.length ? Math.round(allAudits.reduce((s, a) => s + (a.score || 0), 0) / allAudits.length) : 0
    const seoScore = Math.min(100, Math.round(
      (allKeywords.length > 0 ? 20 : 0) +
      Math.min(30, top10 * 5) +
      Math.min(20, totalVol / 2000) +
      (avgAuditScore > 0 ? Math.round(avgAuditScore * 0.3) : 0) +
      Math.min(10, allBacklinks.filter(b => b.status === 'active').length * 2)
    ))

    // Content & Social (15 pts each = 30 pts)
    const publishedContent = allContent.filter(c => c.status === 'published').length
    const contentScore = Math.min(100, Math.round((allContent.length > 0 ? 30 : 0) + Math.min(50, publishedContent * 10) + (allContent.length >= 5 ? 20 : allContent.length * 4)))
    const publishedSocial = allSocial.filter(s => s.status === 'published').length
    const socialScore = Math.min(100, Math.round((allSocial.length > 0 ? 30 : 0) + Math.min(50, publishedSocial * 8) + Math.min(20, allSocial.length * 2)))

    // Lead Generation (15 pts)
    const wonLeads = allLeads.filter(l => l.status === 'won').length
    const activeLeads = allLeads.filter(l => !['won', 'lost'].includes(l.status)).length
    const leadsScore = Math.min(100, Math.round((allLeads.length > 0 ? 20 : 0) + Math.min(40, wonLeads * 15) + Math.min(30, activeLeads * 6) + (allLeads.length >= 5 ? 10 : 0)))

    // Product Activity (15 pts) — tasks + ideas + projects
    const doneTasks = allTasks.filter(t => t.status === 'done').length
    const totalTasks = allTasks.length
    const completionRate = totalTasks > 0 ? doneTasks / totalTasks : 0
    const productScore = Math.min(100, Math.round(
      (allIdeas.filter(i => i.status !== 'draft').length * 10) +
      Math.min(40, doneTasks * 5) +
      Math.round(completionRate * 30) +
      (allIdeas.length > 0 ? 10 : 0)
    ))

    // ─── Weighted Overall Score ───────────────────────────────────────────
    const overall = Math.round(
      (revenueScore * 0.20) +
      (seoScore * 0.20) +
      (contentScore * 0.15) +
      (socialScore * 0.15) +
      (leadsScore * 0.15) +
      (productScore * 0.15)
    )

    const dimensions = [
      { key: 'revenue', label: 'Revenue', score: revenueScore, icon: '💰', insight: mrr > 0 ? `$${mrr}/mo MRR · $${revenue} total` : revenue > 0 ? `$${revenue} revenue tracked` : 'No revenue tracked yet' },
      { key: 'seo', label: 'SEO', score: seoScore, icon: '🔎', insight: allKeywords.length > 0 ? `${allKeywords.length} keywords · ${top10} top-10 · ${allBacklinks.filter(b=>b.status==='active').length} backlinks` : 'No keywords tracked' },
      { key: 'content', label: 'Content', score: contentScore, icon: '✍️', insight: allContent.length > 0 ? `${allContent.length} pieces · ${publishedContent} published` : 'No content created' },
      { key: 'social', label: 'Social', score: socialScore, icon: '📱', insight: allSocial.length > 0 ? `${allSocial.length} posts · ${publishedSocial} published` : 'No social posts' },
      { key: 'leads', label: 'Leads', score: leadsScore, icon: '👥', insight: allLeads.length > 0 ? `${allLeads.length} leads · ${wonLeads} won · ${activeLeads} active` : 'No leads tracked' },
      { key: 'product', label: 'Product', score: productScore, icon: '🎯', insight: allTasks.length > 0 ? `${doneTasks}/${totalTasks} tasks done · ${allIdeas.length} ideas` : 'No tasks logged' },
    ]

    // ─── AI Explanation ───────────────────────────────────────────────────
    const ai = await getAIProvider()
    const weakest = dimensions.sort((a, b) => a.score - b.score)[0]
    const strongest = [...dimensions].sort((a, b) => b.score - a.score)[0]
    const explanationPrompt = `You are a startup advisor. Give a 2-sentence business health assessment for a founder with score ${overall}/100.
Strongest area: ${strongest.label} (${strongest.score}/100) — ${strongest.insight}
Weakest area: ${weakest.label} (${weakest.score}/100) — ${weakest.insight}
Be specific, direct, actionable. No fluff.`
    let explanation = ''
    try { explanation = await ai.generate(explanationPrompt, 'You are a concise startup advisor. Max 2 sentences.') } catch {}
    if (!explanation) explanation = `Your ${strongest.label.toLowerCase()} is your strongest area. Focus on improving ${weakest.label.toLowerCase()} to unlock the next level of growth.`

    res.json({ overall, dimensions, explanation, generatedAt: new Date().toISOString() })
  } catch (error: any) { res.status(500).json({ error: error.message }) }
})

// ─── AI CEO Daily Brief ───────────────────────────────────────────────────────

router.post('/brief', requireAuth, async (req, res) => {
  const user = (req as any).user
  const uid = user.id
  const { businessContext, currentGoals } = req.body

  try {
    const [allKeywords, allFinance, allContent, allLeads, allTasks, allIdeas] = await Promise.all([
      db.select().from(seoKeywords).where(eq(seoKeywords.userId, uid)),
      db.select().from(financeEntries).where(eq(financeEntries.userId, uid)),
      db.select().from(contentPieces).where(eq(contentPieces.userId, uid)),
      db.select().from(leads).where(eq(leads.userId, uid)),
      db.select().from(tasks).where(eq(tasks.userId, uid)),
      db.select().from(businessIdeas).where(eq(businessIdeas.userId, uid)),
    ])

    const pendingTasks = allTasks.filter(t => t.status !== 'done')
    const activeLeads = allLeads.filter(l => !['won', 'lost'].includes(l.status))
    const highPrioKws = allKeywords.filter(k => k.priority === 'high')
    const mrr = allFinance.filter(f => f.type === 'subscription' && f.recurring).reduce((s, f) => s + f.amount, 0)

    const prompt = `You are the AI CEO for a startup founder. Generate their daily executive brief for ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.

Business context: ${businessContext || 'early-stage startup'}
Current goals: ${currentGoals || 'grow revenue and user base'}

Business snapshot:
- MRR: $${mrr}
- Active leads: ${activeLeads.length}
- Pending tasks: ${pendingTasks.length}
- High-priority keywords tracked: ${highPrioKws.length}
- Content pieces: ${allContent.length}
- Ideas in progress: ${allIdeas.filter(i => i.status === 'building').length}

Generate a professional CEO daily brief. Be specific and actionable.

Return JSON:
{
  "greeting": "Good morning, [Founder]. Today is [day] — [one motivating sentence].",
  "topPriorities": [{"title":"","description":"","urgency":"high|medium|low","timeEstimate":""}],
  "biggestRisks": [{"risk":"","impact":"","mitigation":""}],
  "opportunities": [{"opportunity":"","action":"","potentialImpact":""}],
  "focusTasks": [{"task":"","why":"","module":"dashboard|content|seo|crm|finance|projects"}],
  "metrics": {"headline":"","mrr":${mrr},"leadsToday":0,"contentScore":0},
  "quote": ""
}`

    const ai = await getAIProvider()
    const response = await ai.generate(prompt, 'You are an AI CEO advisor. Return ONLY valid JSON.')
    let brief: any = {}
    try { const m = response.match(/\{[\s\S]*\}/); if (m) brief = JSON.parse(m[0]) } catch {}

    if (!brief.topPriorities) {
      brief = {
        greeting: `Good morning, Founder. Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} — your decisions today compound into tomorrow's results.`,
        topPriorities: [
          { title: pendingTasks.length > 0 ? `Complete ${Math.min(3, pendingTasks.length)} pending tasks` : 'Set up your first project tasks', description: 'Execution velocity is your competitive advantage as a founder.', urgency: 'high', timeEstimate: '2-3 hours' },
          { title: activeLeads.length > 0 ? `Follow up with ${activeLeads.length} active leads` : 'Add first leads to your CRM', description: 'No deal closes without consistent follow-up.', urgency: 'high', timeEstimate: '1 hour' },
          { title: 'Publish one piece of content', description: 'Content compounds. Every post builds your authority.', urgency: 'medium', timeEstimate: '30-60 mins' },
        ],
        biggestRisks: [
          { risk: mrr === 0 ? 'No recurring revenue' : 'Revenue concentration risk', impact: mrr === 0 ? 'Business not yet sustainable' : 'Single revenue source is fragile', mitigation: mrr === 0 ? 'Focus on converting 1 lead to a paying customer this week' : 'Diversify with additional revenue streams' },
          { risk: 'Content cadence gap', impact: 'SEO and brand awareness stall without consistent publishing', mitigation: 'Create 3 pieces of content this week using your Content Studio' },
        ],
        opportunities: [
          { opportunity: highPrioKws.length > 0 ? `${highPrioKws.length} high-priority keywords unranked` : 'SEO traffic opportunity', action: 'Generate content briefs for top keywords and publish 2 articles', potentialImpact: 'Organic traffic compound over 60-90 days' },
          { opportunity: 'AI-powered outreach', action: 'Use AI Agents to draft personalized outreach for your top 5 leads', potentialImpact: 'Potential to convert 1-2 leads to customers' },
        ],
        focusTasks: [
          { task: 'Review and respond to all active leads', why: 'Speed to follow-up increases conversion 7x', module: 'crm' },
          { task: 'Write one SEO article', why: 'Content is your highest-leverage marketing channel', module: 'content' },
          { task: 'Update task statuses and plan tomorrow', why: 'Founders who plan daily outperform 40% more', module: 'projects' },
        ],
        metrics: { headline: mrr > 0 ? `$${mrr} MRR · ${activeLeads.length} active leads` : `${activeLeads.length} active leads · ${allContent.length} content pieces`, mrr, leadsToday: activeLeads.length, contentScore: allContent.length },
        quote: 'The most dangerous phrase in the language is "we\'ve always done it this way." — Grace Hopper',
      }
    }

    res.json({ ...brief, generatedAt: new Date().toISOString() })
  } catch (error: any) { res.status(500).json({ error: error.message }) }
})

export default router
