/**
 * AI Intent Classifier — hybrid routing system.
 * Fast regex first, then AI classifier fallback for ambiguous queries.
 * Returns multi-domain confidence scores.
 */
import { getAIProvider } from './index.js'
import type { ExpertMode } from './router.js'
import { detectExpertMode } from './router.js'
import { metrics } from '../observability/metrics.js'

export interface ClassificationResult {
  primary: ExpertMode
  confidence: 'high' | 'medium' | 'low'
  scores: Record<ExpertMode, number>
  secondary: ExpertMode[]
  method: 'regex' | 'classifier' | 'hybrid'
}

const CLASSIFIER_PROMPT = `You are an intent classifier for a founder's AI assistant.

Given a founder's message, score each domain from 0.0 to 1.0 based on relevance.

Domains:
- code: software engineering, debugging, architecture, APIs
- seo: search engine optimization, rankings, keywords, content strategy
- security: cybersecurity, vulnerabilities, authentication, compliance
- data: analytics, metrics, SQL, dashboards, KPIs
- research: market research, competitors, trends, industry analysis
- finance: unit economics, fundraising, SaaS metrics, pricing
- product: product management, features, roadmaps, user experience
- startup: strategy, validation, PMF, scaling, fundraising
- marketing: growth, campaigns, content, brand, channels
- sales: pipeline, outreach, closing, CRM, lead generation
- devops: infrastructure, CI/CD, deployment, monitoring
- legal: contracts, compliance, IP, terms of service
- social: social media, posts, engagement, platform strategy
- content: writing, copy, blog posts, newsletters
- hiring: recruiting, interviews, job descriptions, team building
- design: UI/UX, visual design, accessibility, design systems
- founder: general business advice, mindset, decisions, strategy

Return ONLY valid JSON object with domain scores. Include only domains with score > 0.3.

Example: {"startup": 0.92, "marketing": 0.83, "growth": 0.88}`

export async function classifyIntent(message: string): Promise<ClassificationResult> {
  const start = Date.now()

  // Step 1: Fast regex classification
  const regexResult = detectExpertMode(message)

  // If regex confidence is high, use it directly
  if (regexResult.confidence === 'high') {
    metrics.observe('classifier_latency_ms', Date.now() - start, { method: 'regex' })
    metrics.inc('classifier_total', { method: 'regex' })

    const scores = {} as Record<ExpertMode, number>
    scores[regexResult.mode] = 0.95
    for (const m of regexResult.secondaryModes) scores[m] = 0.7

    return {
      primary: regexResult.mode,
      confidence: 'high',
      scores,
      secondary: regexResult.secondaryModes,
      method: 'regex',
    }
  }

  // Step 2: AI classifier for ambiguous queries
  try {
    const ai = await getAIProvider()
    const raw = await ai.generate(
      `Classify this founder message:\n\n"${message.slice(0, 1000)}"`,
      CLASSIFIER_PROMPT,
      { temperature: 0.1, maxTokens: 300 }
    )

    const parsed = parseClassifierResponse(raw)

    if (parsed && Object.keys(parsed).length > 0) {
      // Sort by score descending
      const sorted = Object.entries(parsed)
        .filter(([, score]) => score > 0.3)
        .sort(([, a], [, b]) => b - a) as [ExpertMode, number][]

      if (sorted.length > 0) {
        const [primary, primaryScore] = sorted[0]
        const secondary = sorted.slice(1, 3).map(([mode]) => mode)

        // Merge with regex result for hybrid signal
        const hybridScore = primaryScore * 0.7 + (regexResult.mode === primary ? 0.3 : 0)
        const confidence = hybridScore > 0.8 ? 'high' : hybridScore > 0.6 ? 'medium' : 'low'

        const scores = {} as Record<ExpertMode, number>
        for (const [mode, score] of sorted) scores[mode] = score

        metrics.observe('classifier_latency_ms', Date.now() - start, { method: 'hybrid' })
        metrics.inc('classifier_total', { method: 'hybrid' })

        return {
          primary,
          confidence,
          scores,
          secondary,
          method: 'hybrid',
        }
      }
    }
  } catch (err: any) {
    console.warn('[Classifier] AI classification failed, using regex:', err.message)
    metrics.inc('classifier_errors', { error: err.message?.slice(0, 50) || 'unknown' })
  }

  // Fallback: regex result
  metrics.observe('classifier_latency_ms', Date.now() - start, { method: 'regex_fallback' })
  metrics.inc('classifier_total', { method: 'regex_fallback' })

  const scores = {} as Record<ExpertMode, number>
  scores[regexResult.mode] = 0.6

  return {
    primary: regexResult.mode,
    confidence: regexResult.confidence,
    scores,
    secondary: regexResult.secondaryModes,
    method: 'regex',
  }
}

function parseClassifierResponse(raw: string): Record<string, number> | null {
  try {
    // Extract JSON from response (handles markdown code blocks)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    const parsed = JSON.parse(jsonMatch[0])
    // Validate: all values should be numbers 0-1
    for (const [key, val] of Object.entries(parsed)) {
      if (typeof val !== 'number' || val < 0 || val > 1) return null
    }
    return parsed
  } catch {
    return null
  }
}
