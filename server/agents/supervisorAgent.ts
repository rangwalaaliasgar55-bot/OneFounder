import { getAIProvider } from '../ai/index'
import { buildMasterPrompt } from '../ai/masterPrompt'
import { getMemoryContextForQuery } from '../memory/memoryRetrieval'
import { buildMemoryContext } from '../memory/memoryManager'
import { assembleRAGContext } from '../rag/contextAssembler'

export type SpecialistType = 
  | 'research'
  | 'engineering'
  | 'marketing'
  | 'seo'
  | 'finance'
  | 'sales'
  | 'security'
  | 'devops'
  | 'product'
  | 'data'
  | 'legal'
  | 'startup'

export interface AgentResult {
  agent: SpecialistType
  response: string
  confidence: number
  executionTimeMs: number
}

export interface SupervisorResult {
  synthesis: string
  agentsUsed: SpecialistType[]
  agentResults: AgentResult[]
  totalTimeMs: number
  memoryUsed: boolean
  ragUsed: boolean
}

const AGENT_PROMPTS: Record<SpecialistType, string> = {
  research: `You are the Research Agent — world-class market researcher and competitive intelligence analyst. 
Focus: TAM/SAM/SOM analysis, competitive landscape, market trends, industry data, customer validation signals.
Structure your response as: Key Findings → Market Data → Competitive Intelligence → Opportunities → Risks`,

  engineering: `You are the Engineering Agent — senior staff engineer with 15+ years production experience.
Focus: Architecture decisions, code quality, technical debt, scalability, security, implementation.
Structure your response as: Technical Assessment → Recommended Approach → Implementation Details → Trade-offs → Risks`,

  marketing: `You are the Marketing Agent — CMO-level growth strategist.
Focus: Brand, funnels, acquisition channels, content strategy, campaign frameworks, copywriting.
Structure your response as: Strategy → Channels (ranked by ROI) → Messaging → Metrics → 30-Day Plan`,

  seo: `You are the SEO Command Center — SEO director with full technical, content, and programmatic SEO mastery.
Focus: Keyword strategy, technical SEO, content clusters, E-E-A-T, Core Web Vitals, backlink acquisition.
Structure your response as: Quick Wins → Technical Issues → Content Opportunities → Authority Building → KPIs`,

  finance: `You are the Finance Agent — CFO-level startup finance expert.
Focus: Unit economics, SaaS metrics, fundraising, pricing strategy, financial modeling, runway analysis.
Structure your response as: Key Numbers → Financial Analysis → Benchmarks → Action Items → Risk Flags`,

  sales: `You are the Sales Agent — enterprise sales director with proven closing track record.
Focus: Pipeline, outbound sequences, objection handling, deal mechanics, CRM strategy, revenue forecasting.
Structure your response as: Strategy → Scripts/Sequences → Objection Handling → Pipeline Design → Revenue Impact`,

  security: `You are the Security Agent — OSCP-level penetration tester and security architect.
Focus: OWASP Top 10, threat modeling, authentication security, infrastructure hardening, compliance.
Structure your response as: Risk Assessment (Critical/High/Medium/Low) → Attack Vectors → Remediation → Validation`,

  devops: `You are the DevOps Agent — platform engineer with full cloud and infrastructure mastery.
Focus: CI/CD, containerization, observability, scaling, IaC, reliability engineering, cost optimization.
Structure your response as: Architecture Recommendation → Implementation → SLO Targets → Cost Analysis → Risks`,

  product: `You are the Product Agent — CPO-level product leader.
Focus: User research synthesis, feature prioritization (RICE/Kano), roadmap planning, PMF analysis, metrics.
Structure your response as: Problem Definition → Recommendation → Framework Applied → Success Metrics → Risks`,

  data: `You are the Data Agent — data scientist and business intelligence architect.
Focus: KPI frameworks, SQL optimization, cohort analysis, funnel analysis, predictive modeling, dashboards.
Structure your response as: Key Insight → Analysis with Numbers → Recommended Visualization → Action Items → SQL`,

  legal: `You are the Legal Operations Agent — startup legal operations specialist.
Focus: IP protection, contracts, compliance, equity structures, founder agreements, regulatory requirements.
Structure your response as: Risk Assessment → Recommended Framework → Key Clauses → Red Flags → Next Steps (Note: this is legal ops guidance, not legal advice)`,

  startup: `You are the Founder Agent — YC-partner-level advisor with fiduciary duty to this founder.
Focus: Business model, PMF, go-to-market, fundraising strategy, team building, priority setting, pivots.
Structure your response as: Direct Recommendation → Mental Model → Common Mistakes → Next 3 Actions → Success Metrics`,
}

function selectAgents(query: string): SpecialistType[] {
  const lower = query.toLowerCase()
  const agents: SpecialistType[] = []

  const patterns: [RegExp, SpecialistType][] = [
    [/\b(research|competitor|market|industry|trend|landscape|tam|sam|som)\b/, 'research'],
    [/\b(code|build|implement|bug|debug|engineer|architect|typescript|python|api|database)\b/, 'engineering'],
    [/\b(marketing|brand|campaign|content|email|social|ads?|growth|viral|funnels?)\b/, 'marketing'],
    [/\b(seo|keyword|ranking|backlink|serp|organic|search engine)\b/, 'seo'],
    [/\b(finance|revenue|mrr|arr|burn|runway|fundraising|investor|pricing|unit economics|cac|ltv)\b/, 'finance'],
    [/\b(sales|sell|pipeline|crm|lead|prospect|close|outreach|cold email)\b/, 'sales'],
    [/\b(security|vulnerability|hack|protect|secure|encrypt|auth|owasp)\b/, 'security'],
    [/\b(devops|infrastructure|deploy|docker|kubernetes|cloud|aws|ci|cd|monitoring)\b/, 'devops'],
    [/\b(product|feature|roadmap|user story|mvp|pmf|ux|ui|sprint)\b/, 'product'],
    [/\b(data|analytics|metrics|kpi|dashboard|sql|chart|cohort|retention)\b/, 'data'],
    [/\b(legal|contract|terms|gdpr|compliance|ip|trademark|nda|equity|vesting)\b/, 'legal'],
    [/\b(startup|business model|strategy|vision|hire|scale|pitch|go.?to.?market)\b/, 'startup'],
  ]

  for (const [pattern, agent] of patterns) {
    if (pattern.test(lower)) agents.push(agent)
  }

  if (agents.length === 0) agents.push('startup', 'research')
  if (agents.length > 5) return agents.slice(0, 4)

  return [...new Set(agents)]
}

async function runSpecialistAgent(
  agent: SpecialistType,
  query: string,
  memoryContext: string,
  ragContext: string
): Promise<AgentResult> {
  const start = Date.now()
  try {
    const ai = await getAIProvider()
    const agentPrompt = AGENT_PROMPTS[agent]
    const systemPrompt = [
      agentPrompt,
      memoryContext ? `\n\n## Founder Memory Context\n${memoryContext}` : '',
      ragContext ? `\n\n## Knowledge Base Context\n${ragContext}` : '',
    ].filter(Boolean).join('')

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: query },
    ]

    const response = await ai.chat(messages)
    return {
      agent,
      response,
      confidence: 0.85,
      executionTimeMs: Date.now() - start,
    }
  } catch (err: any) {
    return {
      agent,
      response: `[${agent} agent encountered an error: ${err.message}]`,
      confidence: 0,
      executionTimeMs: Date.now() - start,
    }
  }
}

async function synthesizeResults(
  query: string,
  results: AgentResult[],
  memoryContext: string
): Promise<string> {
  const ai = await getAIProvider()

  const agentOutputs = results
    .filter(r => r.confidence > 0)
    .map(r => `## ${r.agent.toUpperCase()} AGENT\n${r.response}`)
    .join('\n\n---\n\n')

  const synthesisPrompt = `You are OneFounder Supreme — the master orchestrator. You have received analysis from ${results.length} specialist agents. Your job is to synthesize their outputs into ONE cohesive, elite-tier response.

Rules:
- Merge insights across agents intelligently (don't just concatenate)
- Prioritize the most actionable and high-impact points
- Resolve any conflicting recommendations with clear reasoning
- Structure as a unified strategy, not a list of agent outputs
- Write as if an elite team of founders, engineers, and advisors collaborated
- Be direct. Be specific. Include real numbers, frameworks, and next steps.

ORIGINAL QUESTION: ${query}

${memoryContext ? `FOUNDER CONTEXT:\n${memoryContext}\n\n` : ''}SPECIALIST AGENT OUTPUTS:
${agentOutputs}

Synthesize into a single, comprehensive, elite-tier response:`

  const messages = [
    { role: 'system' as const, content: 'You are OneFounder Supreme. Synthesize multi-agent outputs into a single elite-tier response. Be direct, specific, and strategic. Never list agent names in your output.' },
    { role: 'user' as const, content: synthesisPrompt },
  ]

  return await ai.chat(messages)
}

export async function executeMultiAgent(
  userId: string,
  query: string,
  forceAgents?: SpecialistType[]
): Promise<SupervisorResult> {
  const start = Date.now()

  const agents = forceAgents || selectAgents(query)

  const [memoryContext, ragContext] = await Promise.all([
    getMemoryContextForQuery(userId, query).catch(() => ''),
    assembleRAGContext(userId, query).catch(() => ''),
  ])

  const agentResults = await Promise.all(
    agents.map(agent => runSpecialistAgent(agent, query, memoryContext, ragContext))
  )

  const successfulResults = agentResults.filter(r => r.confidence > 0)
  const synthesis = await synthesizeResults(query, successfulResults, memoryContext)

  return {
    synthesis,
    agentsUsed: agents,
    agentResults,
    totalTimeMs: Date.now() - start,
    memoryUsed: memoryContext.length > 0,
    ragUsed: ragContext.length > 0,
  }
}
