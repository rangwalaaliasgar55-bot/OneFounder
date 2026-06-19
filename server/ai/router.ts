export type ExpertMode =
  | 'code'
  | 'seo'
  | 'security'
  | 'data'
  | 'startup'
  | 'research'
  | 'finance'
  | 'product'
  | 'founder'
  | 'marketing'
  | 'sales'
  | 'devops'
  | 'legal'

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
      /\b(core web vitals|lcp|cls|inp|e.?e.?a.?t|topical authority|content cluster)\b/i,
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
      /\b(soc 2|gdpr|hipaa|compliance|pen test|red team|blue team|zero trust)\b/i,
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
      /\b(report|dashboard|insight|forecast|predict|model|bi|business intelligence)\b/i,
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
      /\b(tam|sam|som|market opportunity|competitive intelligence|due diligence)\b/i,
    ],
    keywords: ['research', 'competitor', 'industry', 'trend', 'market', 'compare', 'explain'],
  },
  {
    mode: 'finance',
    patterns: [
      /\b(finance|financial|money|cash|revenue|profit|loss|income|expense|cost|budget)\b/i,
      /\b(mrr|arr|churn|burn rate|runway|valuation|cap table|equity|dilution|round)\b/i,
      /\b(fundraising|investor|vc|angel|seed|series a|pitch|term sheet|safe|convertible)\b/i,
      /\b(accounting|bookkeeping|tax|vat|invoice|payroll|salary|roi|irr|npv)\b/i,
      /\b(pricing|subscription|freemium|ltv|cac|payback period|gross margin|unit economics)\b/i,
      /\b(p&l|balance sheet|cash flow|forecast|projection|model|break.?even)\b/i,
    ],
    keywords: ['finance', 'revenue', 'profit', 'burn rate', 'runway', 'fundraising', 'investor', 'valuation', 'pricing', 'budget'],
  },
  {
    mode: 'product',
    patterns: [
      /\b(product|feature|roadmap|user story|sprint|backlog|mvp|prototype|wireframe)\b/i,
      /\b(user experience|ux|ui|design|interface|usability|accessibility|a\/b test)\b/i,
      /\b(product.?market fit|pmf|nps|csat|retention|activation|onboarding|churn)\b/i,
      /\b(discovery|validation|hypothesis|experiment|feedback|interview|survey)\b/i,
      /\b(prioritize|priority|rice|kano|moscow|jobs.?to.?be.?done|jtbd)\b/i,
      /\b(launch|release|v\d|version|milestone|epic|story point|velocity)\b/i,
    ],
    keywords: ['product', 'feature', 'roadmap', 'mvp', 'ux', 'user', 'sprint', 'backlog', 'pmf', 'launch'],
  },
  {
    mode: 'marketing',
    patterns: [
      /\b(marketing|brand|campaign|content|email|newsletter|social media|ads?|advertising)\b/i,
      /\b(copywriting|headline|hook|cta|call to action|conversion|funnels?|lead gen)\b/i,
      /\b(facebook|instagram|tiktok|linkedin post|twitter|youtube|influencer|viral)\b/i,
      /\b(demand gen|growth hacking|product hunt|launch|press release|pr|media)\b/i,
      /\b(roas|cpa|cpl|impressions|reach|engagement|click.?through|open rate)\b/i,
      /\b(seo content|blog strategy|thought leadership|personal brand|positioning)\b/i,
    ],
    keywords: ['marketing', 'brand', 'campaign', 'email', 'content', 'ads', 'viral', 'growth', 'funnels'],
  },
  {
    mode: 'sales',
    patterns: [
      /\b(sales|sell|selling|close|closing|deal|pipeline|crm|lead|prospect|outbound|inbound)\b/i,
      /\b(cold email|cold outreach|linkedin outreach|discovery call|demo|proposal|contract)\b/i,
      /\b(objection|follow.?up|sequence|cadence|quota|commission|forecast|win rate)\b/i,
      /\b(meddic|spin selling|challenger|consultative|value.?based|enterprise sales)\b/i,
      /\b(salesforce|hubspot|pipedrive|outreach|apollo|clay|zoominfo)\b/i,
    ],
    keywords: ['sales', 'sell', 'deal', 'pipeline', 'lead', 'prospect', 'close', 'outreach', 'crm'],
  },
  {
    mode: 'devops',
    patterns: [
      /\b(devops|infrastructure|server|cloud|aws|gcp|azure|kubernetes|k8s|docker|container)\b/i,
      /\b(ci\/cd|github actions|deploy|deployment|pipeline|terraform|ansible|helm)\b/i,
      /\b(monitoring|observability|prometheus|grafana|datadog|logging|alerting|slo|sla)\b/i,
      /\b(load balancer|cdn|nginx|reverse proxy|ssl cert|domain|dns|vpc|subnet)\b/i,
      /\b(autoscaling|horizontal scaling|microservice|serverless|lambda|edge|vercel|railway)\b/i,
    ],
    keywords: ['devops', 'infrastructure', 'server', 'cloud', 'aws', 'docker', 'kubernetes', 'deploy', 'ci/cd'],
  },
  {
    mode: 'legal',
    patterns: [
      /\b(legal|law|contract|agreement|terms|privacy policy|gdpr|compliance|ip|intellectual property)\b/i,
      /\b(terms of service|tos|eula|nda|non.?disclosure|shareholder|founder agreement)\b/i,
      /\b(trademark|patent|copyright|open source|license|mit|apache|gpl|saas agreement)\b/i,
      /\b(employment|contractor|equity|vesting|cliff|409a|83b|cap table|legal entity)\b/i,
      /\b(lawsuit|liability|indemnification|arbitration|jurisdiction|governing law)\b/i,
    ],
    keywords: ['legal', 'contract', 'terms', 'privacy', 'gdpr', 'ip', 'trademark', 'compliance', 'nda'],
  },
  {
    mode: 'startup',
    patterns: [
      /\b(startup|business model|market fit|customer discovery|go.?to.?market|gtm)\b/i,
      /\b(value prop|value proposition|pitch|vision|mission|hire|team|culture|co-founder)\b/i,
      /\b(scale|growth|expansion|acquisition|operations|okr|yc|accelerator|pivot)\b/i,
      /\b(business strategy|competitive advantage|moat|differentiation|positioning)\b/i,
    ],
    keywords: ['startup', 'business', 'strategy', 'market', 'customer', 'growth', 'mvp'],
  },
  {
    mode: 'founder',
    patterns: [
      /\b(help me|what should|advice|guidance|mentor|coach|overall|holistic)\b/i,
      /\b(founder|ceo|coo|cfo|cto|cmo|cpo|chief)\b/i,
      /\b(priority|prioriti[sz]e|focus|next step|roadmap|vision|mission)\b/i,
      /\b(challenge|struggle|stuck|overwhelm|burnout|work.?life)\b/i,
      /\b(decision|decide|choose|trade.?off|pros and cons)\b/i,
    ],
    keywords: ['help', 'advice', 'founder', 'priority', 'focus', 'challenge', 'decision', 'overall'],
  },
]

export function detectExpertMode(message: string): RouteResult {
  const scores: Record<ExpertMode, number> = {
    code: 0, seo: 0, security: 0, data: 0, research: 0,
    finance: 0, product: 0, startup: 0, founder: 0,
    marketing: 0, sales: 0, devops: 0, legal: 0,
  }

  const detected: Record<ExpertMode, string[]> = {
    code: [], seo: [], security: [], data: [], research: [],
    finance: [], product: [], startup: [], founder: [],
    marketing: [], sales: [], devops: [], legal: [],
  }

  // Weight: pattern matches count, but cap per-pattern to avoid word-frequency bias
  for (const rule of ROUTING_RULES) {
    for (const pattern of rule.patterns) {
      const matches = message.match(pattern)
      if (matches) {
        // Cap at 2 per pattern to prevent a single word repeated 5x from dominating
        scores[rule.mode] += Math.min(matches.length, 2)
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

  const confidence = topScore >= 4 ? 'high' : topScore >= 2 ? 'medium' : 'low'

  return {
    mode: topScore === 0 ? 'founder' : topMode,
    confidence,
    detectedKeywords: [...new Set(detected[topMode])].slice(0, 5),
  }
}

export const MODE_LABELS: Record<ExpertMode, string> = {
  code: '💻 Engineering Agent',
  seo: '🔍 SEO Command Center',
  security: '🔒 Security Agent',
  data: '📊 Data Agent',
  research: '🔬 Deep Research Engine',
  finance: '💰 Finance Agent',
  product: '🧩 Product Agent',
  startup: '🚀 Founder Agent',
  founder: '⚡ OneFounder Supreme',
  marketing: '📣 Marketing Agent',
  sales: '💼 Sales Agent',
  devops: '☁️ DevOps Agent',
  legal: '⚖️ Legal Ops Agent',
}

export const MODE_COLORS: Record<ExpertMode, string> = {
  code: 'blue',
  seo: 'green',
  security: 'red',
  data: 'purple',
  research: 'yellow',
  finance: 'emerald',
  product: 'pink',
  startup: 'orange',
  founder: 'indigo',
  marketing: 'rose',
  sales: 'cyan',
  devops: 'slate',
  legal: 'amber',
}
