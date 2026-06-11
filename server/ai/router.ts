export type ExpertMode =
  | 'code'
  | 'seo'
  | 'security'
  | 'data'
  | 'startup'
  | 'research'
  | 'founder'

export interface RouteResult {
  mode: ExpertMode
  confidence: 'high' | 'medium' | 'low'
  detectedKeywords: string[]
}

const ROUTING_RULES: Array<{
  mode: ExpertMode
  patterns: RegExp[]
  keywords: string[]
}> = [
  {
    mode: 'code',
    patterns: [
      /\b(code|coding|program|script|function|class|method|bug|error|debug|refactor|implement|build|develop)\b/i,
      /\b(typescript|javascript|python|react|node|express|sql|api|endpoint|component|hook)\b/i,
      /\b(syntax|compile|runtime|stacktrace|exception|null|undefined|array|object|loop)\b/i,
      /\b(git|deploy|docker|ci\/cd|test|unit test|integration|lint)\b/i,
      /```[\s\S]*```/,
      /def |const |let |var |import |export |async |await |return |class /,
    ],
    keywords: ['code', 'bug', 'error', 'function', 'debug', 'implement', 'script', 'typescript', 'python', 'javascript', 'refactor'],
  },
  {
    mode: 'seo',
    patterns: [
      /\b(seo|search engine optimization|keywords?|ranking|backlink|serp|sitemap|crawl)\b/i,
      /\b(google|bing|traffic|organic search|click.?through|ctr|domain authority|page speed)\b/i,
      /\b(content marketing|blog post|on.?page|off.?page|technical seo|local seo)\b/i,
      /\b(alt tag|h1|canonical|redirect|301|schema markup|rich snippet|meta description)\b/i,
      /\b(landing page|rank|optimize for search|search visibility|search traffic)\b/i,
    ],
    keywords: ['seo', 'keywords', 'ranking', 'backlink', 'organic', 'sitemap', 'meta', 'landing page'],
  },
  {
    mode: 'security',
    patterns: [
      /\b(security|vulnerability|exploit|hack|attack|penetration|pentest|injection)\b/i,
      /\b(xss|csrf|sql injection|rce|lfi|rfi|ssrf|idor|cors|jwt|auth bypass)\b/i,
      /\b(firewall|encryption|ssl|tls|certificate|password|hash|salt|token|secret)\b/i,
      /\b(malware|phishing|ddos|brute force|zero.?day|cve|patch|owasp)\b/i,
      /\b(secure|insecure|unsafe|protect|harden|audit|threat|risk)\b/i,
    ],
    keywords: ['security', 'vulnerability', 'hack', 'attack', 'secure', 'exploit', 'injection', 'xss', 'auth'],
  },
  {
    mode: 'data',
    patterns: [
      /\b(data|analyze|analysis|statistics|metrics|kpi|chart|graph|visuali[sz]e)\b/i,
      /\b(csv|json|excel|spreadsheet|database|query|aggregate|filter|pivot)\b/i,
      /\b(trend|pattern|correlation|regression|average|median|outlier|distribution)\b/i,
      /\b(revenue|mrr|arr|churn|ltv|cac|conversion|funnel|cohort|retention)\b/i,
      /\b(report|dashboard|insight|forecast|predict|model)\b/i,
    ],
    keywords: ['data', 'analyze', 'metrics', 'kpi', 'csv', 'statistics', 'trend', 'chart', 'revenue data', 'mrr'],
  },
  {
    mode: 'research',
    patterns: [
      /\b(research|competitor|competitive|industry|market size|landscape|benchmark)\b/i,
      /\b(who is|what is|how does|tell me about|explain|overview of|summary of)\b/i,
      /\b(trend|news|recent|latest|current|2024|2025|2026|report|study|survey)\b/i,
      /\b(compare|vs\.?|versus|alternative|option|choice|pros and cons)\b/i,
    ],
    keywords: ['research', 'competitor', 'industry', 'trend', 'market', 'compare', 'explain'],
  },
  {
    mode: 'startup',
    patterns: [
      /\b(startup|business|product|market|revenue|customer|funding|pitch|investor)\b/i,
      /\b(strategy|roadmap|vision|mission|value prop|mvp|go.?to.?market|gtm)\b/i,
      /\b(hire|team|culture|founder|co-founder|equity|vesting|runway|burn rate)\b/i,
      /\b(scale|growth|expansion|acquisition|retention|nps|feedback|user)\b/i,
    ],
    keywords: ['startup', 'business', 'strategy', 'product', 'market', 'revenue', 'customer', 'growth', 'mvp'],
  },
]

export function detectExpertMode(message: string): RouteResult {
  const scores: Record<ExpertMode, number> = {
    code: 0, seo: 0, security: 0, data: 0, research: 0, startup: 0, founder: 0,
  }

  const detected: Record<ExpertMode, string[]> = {
    code: [], seo: [], security: [], data: [], research: [], startup: [], founder: [],
  }

  for (const rule of ROUTING_RULES) {
    for (const pattern of rule.patterns) {
      const matches = message.match(pattern)
      if (matches) {
        scores[rule.mode] += matches.length
        detected[rule.mode].push(...matches.slice(0, 2))
      }
    }
  }

  let topMode: ExpertMode = 'founder'
  let topScore = 0
  for (const [mode, score] of Object.entries(scores) as [ExpertMode, number][]) {
    if (score > topScore) {
      topScore = score
      topMode = mode
    }
  }

  const confidence = topScore >= 3 ? 'high' : topScore >= 1 ? 'medium' : 'low'

  return {
    mode: topScore === 0 ? 'founder' : topMode,
    confidence,
    detectedKeywords: [...new Set(detected[topMode])].slice(0, 5),
  }
}

export const MODE_LABELS: Record<ExpertMode, string> = {
  code: '💻 Code Expert',
  seo: '🔍 SEO Expert',
  security: '🔒 Security Expert',
  data: '📊 Data Analyst',
  research: '🔬 Research Expert',
  startup: '🚀 Startup Advisor',
  founder: '🧠 Founder AI',
}

export const MODE_COLORS: Record<ExpertMode, string> = {
  code: 'blue',
  seo: 'green',
  security: 'red',
  data: 'purple',
  research: 'yellow',
  startup: 'orange',
  founder: 'indigo',
}
