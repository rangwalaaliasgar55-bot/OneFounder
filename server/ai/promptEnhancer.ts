import type { ExpertMode } from './router'
import { buildMasterPrompt, MODE_ADDITIONS } from './masterPrompt'

const TODAY = () => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

// Query templates that sharpen the user's message for each mode
const EXPERT_PROMPT_TEMPLATES: Record<ExpertMode, (userMessage: string) => string> = {
  code: (msg) => `${msg}

Provide:
1. Complete, working solution with proper TypeScript types
2. Brief explanation of the approach and key decisions
3. Edge cases, gotchas, or potential bugs to watch for
4. Suggested improvements or alternatives if relevant`,

  seo: (msg) => `${msg}

Provide:
1. Specific, actionable recommendations with priority ranking
2. Exact keywords or meta tag copy where applicable
3. Implementation steps with estimated time/effort
4. Expected impact on rankings/traffic
5. Quick wins vs. long-term plays`,

  security: (msg) => `${msg}

Provide:
1. Security assessment with severity ratings (Critical/High/Medium/Low)
2. Specific attack vectors and how they would be exploited
3. Exact remediation code or configuration
4. OWASP/CWE references where applicable
5. Validation steps to confirm the fix works`,

  data: (msg) => `${msg}

Provide:
1. Key insight / main finding upfront
2. Detailed analysis with specific numbers
3. Recommended visualization type
4. Actionable business recommendations
5. SQL or formula if a calculation is involved`,

  research: (msg) => `${msg}

Provide:
1. Executive summary (2-3 sentences)
2. Key findings with specific data points and company examples
3. Competitive landscape overview
4. Opportunities and threats ranked by impact
5. Recommended next steps`,

  finance: (msg) => `${msg}

Provide:
1. Direct answer with specific numbers and calculations shown
2. Industry benchmarks to contextualize the numbers (cite source/standard)
3. The key financial risks or red flags to watch
4. Immediate action items (what to do in the next 30 days)
5. Modeling assumptions if a forecast is involved`,

  product: (msg) => `${msg}

Provide:
1. Direct recommendation — no hedging
2. The product framework applied (RICE, Kano, JTBD, etc.) and why
3. How to measure success (specific metrics, baseline, target)
4. Common mistakes product teams make in this area
5. What "good" looks like at scale (reference a real company or product)`,

  startup: (msg) => `${msg}

Provide:
1. Direct answer/recommendation — no hedging
2. The reasoning and mental model behind it
3. Common mistakes founders make in this area
4. 2-3 specific next actions with owners and deadlines
5. How to measure success`,

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

// Keep this export for any route that imports EXPERT_SYSTEM_PROMPTS directly
export const EXPERT_SYSTEM_PROMPTS: Record<ExpertMode, string> = Object.fromEntries(
  (['code', 'seo', 'security', 'data', 'research', 'finance', 'product', 'startup', 'founder'] as ExpertMode[]).map(
    mode => [mode, buildMasterPrompt(mode)]
  )
) as Record<ExpertMode, string>
