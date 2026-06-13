import type { ExpertMode } from './router.js'
import { buildMasterPrompt, MODE_ADDITIONS } from './masterPrompt.js'

const TODAY = () => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

const EXPERT_PROMPT_TEMPLATES: Record<ExpertMode, (userMessage: string) => string> = {
  code: (msg) => `${msg}

Provide:
1. Complete, working solution with proper TypeScript types
2. Brief explanation of the approach and key architectural decisions
3. Edge cases, gotchas, or potential bugs to watch for
4. Security considerations if relevant
5. Suggested improvements or alternatives if applicable`,

  seo: (msg) => `${msg}

Provide:
1. Specific, actionable recommendations with priority ranking
2. Exact keywords or meta tag copy where applicable
3. Implementation steps with estimated time/effort
4. Expected impact on rankings/traffic with timeline
5. Quick wins (0-30 days) vs. long-term plays (3-6 months)`,

  security: (msg) => `${msg}

Provide:
1. Security assessment with severity ratings (Critical/High/Medium/Low/Informational)
2. Specific attack vectors and how they would be exploited
3. Exact remediation code or configuration changes
4. OWASP/CWE references where applicable
5. Validation steps to confirm the fix works`,

  data: (msg) => `${msg}

Provide:
1. Key insight / main finding upfront in one sentence
2. Detailed analysis with specific numbers and calculations shown
3. Recommended visualization type and why
4. Actionable business recommendations from the data
5. SQL query or formula if a calculation is involved`,

  research: (msg) => `${msg}

Provide:
1. Executive summary (2-3 sentences with the most important finding)
2. Key findings with specific data points and real company examples
3. Competitive landscape overview with named players
4. Opportunities and threats ranked by impact
5. Recommended next steps with owners and timeline`,

  finance: (msg) => `${msg}

Provide:
1. Direct answer with specific numbers and calculations shown
2. Industry benchmarks to contextualize the numbers (cite standard/source)
3. Key financial risks or red flags to watch for
4. Immediate action items (what to do in the next 30 days)
5. Modeling assumptions if a forecast is involved`,

  product: (msg) => `${msg}

Provide:
1. Direct recommendation — no hedging
2. The product framework applied (RICE, Kano, JTBD, MoSCoW, etc.) and why
3. How to measure success (specific metrics, baseline, target)
4. Common mistakes product teams make in this area
5. What "good" looks like at scale (reference a real company or product)`,

  startup: (msg) => `${msg}

Provide:
1. Direct answer/recommendation — no hedging, no "it depends"
2. The reasoning and mental model behind it
3. Common mistakes founders make in this exact area
4. 2-3 specific next actions with owners and deadlines
5. How to measure success and know when to pivot`,

  marketing: (msg) => `${msg}

Provide:
1. Core strategy recommendation with clear reasoning
2. Specific channels ranked by expected ROI for this stage
3. Exact messaging framework (hook → story → CTA structure)
4. Key metrics to track and target numbers
5. 30-day execution plan with specific tasks`,

  sales: (msg) => `${msg}

Provide:
1. Direct recommendation on the sales approach
2. Specific scripts, sequences, or frameworks to use
3. Objection handling for the top 3 likely objections
4. Pipeline stage optimization — where deals typically stall and why
5. Revenue impact projection if executed correctly`,

  devops: (msg) => `${msg}

Provide:
1. Architecture recommendation with clear reasoning
2. Specific configuration, IaC code, or CLI commands needed
3. SLO targets and monitoring setup
4. Cost estimate and optimization opportunities
5. Common pitfalls and how to avoid them at this scale`,

  legal: (msg) => `${msg}

Provide:
1. Legal risk assessment with severity (High/Medium/Low)
2. Specific clauses, frameworks, or structures to use
3. Red flags to watch for in contracts or agreements
4. Recommended next steps (DIY vs. engage counsel)
5. Note: This is legal operations guidance — for binding legal matters, engage qualified counsel in your jurisdiction`,

  founder: (msg) => msg,
}

export function enhancePrompt(userMessage: string, mode: ExpertMode, founderContext?: string): {
  systemPrompt: string
  enhancedMessage: string
} {
  const systemPrompt = buildMasterPrompt(mode, founderContext)
    .replace(/\$\{TODAY\(\)\}/g, TODAY())
    + `\n\nToday is ${TODAY()}.`

  return {
    systemPrompt,
    enhancedMessage: EXPERT_PROMPT_TEMPLATES[mode](userMessage),
  }
}

export const EXPERT_SYSTEM_PROMPTS: Record<ExpertMode, string> = Object.fromEntries(
  (['code', 'seo', 'security', 'data', 'research', 'finance', 'product', 'startup', 'founder', 'marketing', 'sales', 'devops', 'legal'] as ExpertMode[]).map(
    mode => [mode, buildMasterPrompt(mode)]
  )
) as Record<ExpertMode, string>
