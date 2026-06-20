import type { ExpertMode } from './router.js'
import { buildMasterPrompt } from './masterPrompt.js'

const TODAY = () => new Date().toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
})

/**
 * Per-mode message enhancers — appended to the user message to enforce
 * structured, high-quality output for every specialist mode.
 */
const EXPERT_PROMPT_TEMPLATES: Record<ExpertMode, (msg: string) => string> = {

  code: (msg) => `${msg}

REQUIRED OUTPUT FORMAT:
1. **Solution** — complete, working code with strict TypeScript types (no stubs, no placeholders, no "// implement this")
2. **Architecture rationale** — why this approach over the 2 most common alternatives
3. **Edge cases & gotchas** — at least 3 specific things that can go wrong and exactly how to handle them
4. **Security considerations** — any auth, input validation, injection, or data exposure concerns
5. **Testing strategy** — unit test sketch with the 3 most important test cases to cover
6. **Performance notes** — time/space complexity or I/O bottlenecks if relevant

If the question touches a database: include the query + index recommendation.
If the question touches an API: include error handling for 4xx, 5xx, and network timeouts.
If the question touches auth: include the complete auth flow, not just the happy path.`,

  seo: (msg) => `${msg}

REQUIRED OUTPUT FORMAT:
1. **Priority matrix** — top 5 actions ranked by (Impact ✕ Effort), with estimated traffic uplift for each
2. **Keyword targets** — for each recommended keyword: search volume, keyword difficulty (0-100), CPC, and search intent
3. **Exact copy** — write the actual title tag, meta description, H1, and URL slug (not templates — the actual text)
4. **Technical fixes** — Core Web Vitals targets (LCP, CLS, INP), crawlability issues, structured data markup
5. **Content gaps** — specific missing pages or topics based on the query, with content brief outlines
6. **Timeline** — quick wins (0–30 days) vs. compound plays (3–12 months) clearly separated
7. **Measurement** — exactly which GSC/GA4 metrics to track and what "success" looks like at 30/90/180 days`,

  security: (msg) => `${msg}

REQUIRED OUTPUT FORMAT:
1. **Threat summary** — what's the exposure? One-sentence summary of the worst-case scenario.
2. **Findings** — each vulnerability with:
   - Severity: Critical / High / Medium / Low / Informational
   - CVSS base score (e.g., CVSS 9.1 - Critical)
   - OWASP category + CWE number
   - Exact attack vector: step-by-step how an attacker exploits this
   - Exact remediation: working code or config change, not general advice
3. **Root cause** — architectural issue driving these symptoms
4. **Validation** — how to confirm each fix actually works (test script or manual steps)
5. **Hardening roadmap** — prioritized 30-day plan to reach a defensible security posture`,

  data: (msg) => `${msg}

REQUIRED OUTPUT FORMAT:
1. **Key insight** — single most important finding in one sentence (lead with this)
2. **Full analysis** — calculations shown step-by-step, no black boxes; state every assumption
3. **Visualization recommendation** — chart type, axes, what to highlight, and why this viz over alternatives
4. **Business implications** — what this data means for product, marketing, or strategy decisions
5. **SQL / formula** — exact query or spreadsheet formula if computation is involved
6. **Statistical caveats** — sample size concerns, confidence intervals, potential biases, survivorship bias
7. **Next steps** — 3 follow-on analyses or experiments to run based on this finding`,

  research: (msg) => `${msg}

REQUIRED OUTPUT FORMAT:
1. **Executive summary** — 2–3 sentences, most critical finding only, decision-ready
2. **Key findings** — each with a specific data point, not just an assertion (use real numbers, company names, sources)
3. **Competitive landscape** — named players, positioning map, funding levels, estimated market share
4. **Market sizing** — TAM → SAM → SOM with methodology (top-down vs. bottom-up) and sources
5. **Opportunities** — specific, actionable openings ranked by attractiveness and feasibility
6. **Risks & threats** — specific named risks (not generic "competition"), likelihood, and mitigation
7. **Recommended next steps** — 3 concrete actions with owners, timeline, and success criteria`,

  finance: (msg) => `${msg}

REQUIRED OUTPUT FORMAT:
1. **Direct answer** — the number, recommendation, or decision upfront with no hedging
2. **Calculations** — show every formula: e.g., LTV = ARPU ÷ Churn Rate = $150 ÷ 0.05 = $3,000
3. **Benchmarks** — industry standard with source: "Series A SaaS median (Bessemer 2024): 3× ARR multiple"
4. **Scenario analysis** — Bear / Base / Bull with explicit assumption changes for each
5. **Financial risks** — top 3 specific risks with probability estimate and mitigation action
6. **30-day actions** — specific financial moves to take this month (not generic advice)
7. **Fundraising implications** — how this metric affects investor narrative and valuation at next round`,

  product: (msg) => `${msg}

REQUIRED OUTPUT FORMAT:
1. **Recommendation** — clear directive with no hedging ("Build X, not Y, because Z")
2. **Framework applied** — RICE / Kano / MoSCoW / JTBD (show the math: Reach=500, Impact=8, Confidence=70%, Effort=3 → Score=933)
3. **Problem definition** — restate the underlying user problem being solved, not the feature request
4. **Success metrics** — specific KPIs with baseline and 90-day targets (e.g., D7 retention: 34% → 48%)
5. **PRD skeleton** — Problem → Proposed Solution → Out of Scope → Success Criteria → Risks (5 bullets each)
6. **Anti-patterns** — top 3 mistakes product teams make in this exact situation
7. **Reference** — how a company at the next stage (Stripe / Linear / Figma / Notion) handles this`,

  marketing: (msg) => `${msg}

REQUIRED OUTPUT FORMAT:
1. **Strategy recommendation** — one clear direction (not 5 options) with rationale
2. **Channel stack** — top 3 channels ranked by ROI for THIS specific stage, ICP, and budget; include why the others are deprioritized
3. **Messaging framework** — actual headline + hook + value prop + CTA (not a template — the actual words)
4. **Copy samples** — write at least 1 complete piece: email subject + body, or ad copy, or LinkedIn post
5. **30-day plan** — week-by-week tasks with owners, deliverables, and expected outputs
6. **Metrics & targets** — exact KPIs (CPC < $X, ROAS > Y, open rate > Z%) with tracking setup
7. **Budget allocation** — if budget is mentioned, give the exact split across channels with rationale`,

  sales: (msg) => `${msg}

REQUIRED OUTPUT FORMAT:
1. **Approach recommendation** — the exact sales motion to use and why (outbound/inbound/PLG/enterprise)
2. **Script / sequence** — write the complete outreach message, call script, or follow-up sequence (not a template)
3. **Qualification checklist** — MEDDPICC elements: what's confirmed, what's missing, how to uncover each gap
4. **Objection playbook** — top 3 likely objections with exact rebuttals (not generic — specific to this deal/context)
5. **Discovery questions** — 7 specific questions to uncover pain, budget, timeline, and decision process
6. **Revenue math** — X prospects → Y demos → Z proposals → W closes at $V ACV = $U ARR/month
7. **Next step** — exact wording to use at end of meeting to advance the deal without losing momentum`,

  devops: (msg) => `${msg}

REQUIRED OUTPUT FORMAT:
1. **Architecture recommendation** — the right solution for this specific scale + team size, with reasoning
2. **Complete config** — working YAML / Terraform HCL / Dockerfile / bash — no pseudocode, no "fill in your values"
3. **SLO definition** — SLI metric + target + error budget: e.g., "99.9% success rate on /api/chat over 30d rolling window"
4. **Monitoring setup** — Prometheus queries or Datadog monitors for the 4 golden signals (latency, traffic, errors, saturation)
5. **Cost estimate** — monthly AWS/GCP/Vercel cost at 3 scale points: MVP / 10K users / 100K users
6. **Rollback plan** — exact steps to revert this change if something goes wrong in production
7. **Security hardening** — IAM least privilege, secrets management, network isolation steps specific to this setup`,

  legal: (msg) => `${msg}

REQUIRED OUTPUT FORMAT:
1. **Risk assessment** — overall risk level (High / Medium / Low) with one-sentence rationale
2. **Specific findings** — each risk with: what it is, why it matters, recommended action
3. **Clause language** — actual contract language or framework language, not just a description
4. **Red flags** — top 3 things to refuse or push back on in this type of agreement
5. **DIY vs. lawyer threshold** — explicitly state what can be handled internally vs. requires qualified counsel
6. **Jurisdiction notes** — US-specific vs. global considerations, EU/GDPR implications if relevant
7. **Disclaimer** — Legal ops guidance only. For binding matters, engage qualified legal counsel in your jurisdiction.`,

  social: (msg) => `${msg}

REQUIRED OUTPUT FORMAT:
1. **Platform strategy** — which platform(s) to prioritize for this goal and why (with algorithm context)
2. **Content pillars** — 3–5 specific content pillars that support the business goal, with example post ideas for each
3. **Actual posts** — write 3 complete, publish-ready posts (include hook, body, CTA, hashtags, format notes)
4. **Hook formulas** — 3 scroll-stopping hooks specific to this topic/platform
5. **Algorithm tactics** — specific behaviors that get rewarded on this platform right now (posting time, format, engagement triggers)
6. **Content calendar** — 2-week posting schedule with platform, format, and topic for each slot
7. **Growth playbook** — 3 specific tactics to grow audience in the next 30 days, with effort and expected outcome`,

  content: (msg) => `${msg}

REQUIRED OUTPUT FORMAT:
1. **Content strategy** — goal of this piece (educate / convert / retain / inspire), target audience, key message
2. **Full draft** — complete, publish-ready content with proper structure (not an outline, the actual content)
3. **Headline options** — primary headline + 2 high-CTR alternatives (A/B test worthy)
4. **SEO metadata** — title tag (≤60 chars), meta description (≤155 chars), URL slug, primary + secondary keywords
5. **Framework applied** — name the copywriting framework used (AIDA / PAS / StoryBrand / Hero's Journey) and why
6. **Distribution plan** — where to publish, when, how to repurpose across 3 channels
7. **Performance indicators** — what does success look like for this piece? (views, time-on-page, conversions, shares)`,

  hiring: (msg) => `${msg}

REQUIRED OUTPUT FORMAT:
1. **Role strategy** — IC vs. manager, seniority level, remote/hybrid/local — recommendation with rationale
2. **Job description** — complete, publish-ready JD: headline, responsibilities (outcomes not duties), requirements, nice-to-haves, company pitch, compensation range
3. **Sourcing playbook** — top 3 channels with specific search strings (Boolean for LinkedIn, filters for GitHub, etc.)
4. **Interview process** — complete 3-4 stage process with: format, duration, who conducts, what's evaluated, scorecard
5. **Compensation benchmark** — market range for this role/level/location with source, equity range at this stage
6. **Red flags** — 5 specific signals in resume or interview that should disqualify a candidate for THIS role
7. **30-60-90 plan** — onboarding milestones and success criteria for the first 90 days in this role`,

  design: (msg) => `${msg}

REQUIRED OUTPUT FORMAT:
1. **Design recommendation** — clear directive on what to change and why, connected to user behavior or conversion
2. **Specific values** — hex codes, font names + sizes, spacing (8px grid), border-radius, shadow values — not "use a warm color"
3. **Component spec** — exact Tailwind classes or CSS for any UI element discussed
4. **Visual hierarchy** — what the user's eye should hit first, second, third, and why
5. **Accessibility check** — contrast ratios for text/background pairs (must be ≥ 4.5:1 for body, ≥ 3:1 for large text)
6. **Conversion impact** — how this design change affects CTA click rate, scroll depth, or form completion
7. **Reference designs** — 1–2 specific companies or products whose approach to this element is worth modeling`,

  founder: (msg) => `${msg}

Think holistically across product, marketing, finance, team, and fundraising simultaneously.
Identify the single highest-leverage action, then support it with second and third-order thinking.
Be direct. Be opinionated. Challenge assumptions. Give the answer a great co-founder would give at 2am.`,

  startup: (msg) => `${msg}

REQUIRED OUTPUT FORMAT:
1. **Direct answer** — no hedging, pick a direction and defend it
2. **Mental model** — the framework or principle behind this recommendation (by name)
3. **Hard question** — the question this founder might be avoiding that needs to be asked
4. **Real-world analog** — a specific company that navigated this exact situation and what happened
5. **3 next actions** — specific, owner-assigned, deadline-bound actions with success criteria
6. **Failure modes** — top 2 ways this goes wrong and exactly how to guard against each`,
}

export function enhancePrompt(
  userMessage: string,
  mode: ExpertMode,
  founderContext?: string,
  secondaryModes?: ExpertMode[]
): { systemPrompt: string; enhancedMessage: string } {

  const systemPrompt = buildMasterPrompt(mode, founderContext)

  // Add secondary mode context awareness to system prompt
  let finalSystemPrompt = systemPrompt
  if (secondaryModes && secondaryModes.length > 0) {
    finalSystemPrompt += `\n\n[CROSS-DOMAIN NOTE: This query also touches ${secondaryModes.join(' and ')} territory. Integrate those perspectives into your response where relevant.]`
  }

  const template = EXPERT_PROMPT_TEMPLATES[mode] || EXPERT_PROMPT_TEMPLATES.founder
  const enhancedMessage = template(userMessage)

  return { systemPrompt: finalSystemPrompt, enhancedMessage }
}

// Pre-built system prompts for each mode (used by non-Brain routes)
export const EXPERT_SYSTEM_PROMPTS: Record<ExpertMode, string> = Object.fromEntries(
  (Object.keys(EXPERT_PROMPT_TEMPLATES) as ExpertMode[]).map(
    mode => [mode, buildMasterPrompt(mode)]
  )
) as Record<ExpertMode, string>
