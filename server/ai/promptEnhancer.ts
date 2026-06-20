import type { ExpertMode } from './router.js'
import { buildMasterPrompt, MODE_ADDITIONS } from './masterPrompt.js'

const TODAY = () => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

const EXPERT_PROMPT_TEMPLATES: Record<ExpertMode, (userMessage: string) => string> = {
  code: (msg) => `${msg}

Respond in this structure:
→ ANSWER: Complete, working solution with proper TypeScript types
→ CONTEXT: Architectural decisions and why this approach
→ STEPS: Implementation details, edge cases, gotchas
→ RISKS: Security considerations, potential bugs, performance implications
→ NOW: What to test first, suggested improvements`,

  seo: (msg) => `${msg}

Respond in this structure:
→ ANSWER: Core SEO recommendation with exact keywords (volume + KD + intent)
→ CONTEXT: Why this matters for rankings, competitive landscape
→ STEPS: Implementation with exact meta title, description, H1, URL slug
→ RISKS: What could go wrong, algorithm update risks
→ NOW: Quick wins for the next 24 hours`,

  security: (msg) => `${msg}

Respond in this structure:
→ ANSWER: Security finding with severity (Critical/High/Medium/Low)
→ CONTEXT: Attack vector, OWASP/CWE reference, CVSS score
→ STEPS: Exact remediation code and configuration changes
→ RISKS: What happens if unfixed, blast radius
→ NOW: Immediate action to take`,

  data: (msg) => `${msg}

Respond in this structure:
→ ANSWER: Key insight in one sentence with the number
→ CONTEXT: Why this metric matters, benchmarks, trends
→ STEPS: Full analysis with calculations shown, SQL if applicable
→ RISKS: Data quality issues, confounding factors
→ NOW: Recommended visualization and next analysis`,

  research: (msg) => `${msg}

Respond in this structure:
→ ANSWER: Executive summary — 2-3 sentences, most important finding
→ CONTEXT: Competitive landscape, market sizing (TAM/SAM/SOM)
→ STEPS: Key findings with real company examples and data points
→ RISKS: Threats, market shifts, competitive moats to watch
→ NOW: Next research steps with owners and timeline`,

  finance: (msg) => `${msg}

Respond in this structure:
→ ANSWER: Direct answer with specific numbers
→ CONTEXT: Industry benchmarks, Rule of 40, NRR targets
→ STEPS: Full calculations shown, Bear/Base/Bull scenarios
→ RISKS: Financial red flags, cash runway concerns
→ NOW: Immediate financial action items`,

  product: (msg) => `${msg}

Respond in this structure:
→ ANSWER: Direct recommendation — no hedging
→ CONTEXT: Framework applied (RICE/Kano/JTBD/MoSCoW) and why
→ STEPS: Success metrics with baseline + target
→ RISKS: Common mistakes, what "good" looks like at scale
→ NOW: Next 24-hour product action`,

  startup: (msg) => `${msg}

Respond in this structure:
→ ANSWER: Direct recommendation — no hedging, no "it depends"
→ CONTEXT: Mental model, reasoning, real startup examples
→ STEPS: Specific next actions with owners and deadlines
→ RISKS: Fatal flaws, pivot signals, common founder mistakes
→ NOW: The ONE thing to do in the next 24 hours`,

  marketing: (msg) => `${msg}

Respond in this structure:
→ ANSWER: Core strategy recommendation with channels ranked by ROI
→ CONTEXT: Why this channel mix, funnel positioning, growth loops
→ STEPS: Exact messaging framework — hook → story → CTA with copy
→ RISKS: CAC creep, channel saturation, attribution gaps
→ NOW: 30-day execution plan, first task today`,

  sales: (msg) => `${msg}

Respond in this structure:
→ ANSWER: Direct recommendation on sales approach
→ CONTEXT: Pipeline stage, deal mechanics, MEDDPICC qualification
→ STEPS: Actual script/sequence, objection handling for top 3 objections
→ RISKS: Where deals stall, common kill points
→ NOW: Outreach to send today`,

  devops: (msg) => `${msg}

Respond in this structure:
→ ANSWER: Architecture recommendation with clear reasoning
→ CONTEXT: SLO targets, cost estimate, scale considerations
→ STEPS: Complete YAML/HCL/Dockerfile — no pseudocode
→ RISKS: Failure modes, incident response, disaster recovery
→ NOW: First infrastructure change to make`,

  legal: (msg) => `${msg}

Respond in this structure:
→ ANSWER: Legal risk assessment (High/Medium/Low)
→ CONTEXT: Specific clauses, frameworks, compliance requirements
→ STEPS: Exact clause language, contract structures
→ RISKS: What happens if ignored, liability exposure
→ NOW: DIY vs. engage counsel decision

Note: This is legal operations guidance — for binding legal matters, engage qualified counsel in your jurisdiction.`,

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
