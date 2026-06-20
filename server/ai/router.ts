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
  | 'social'
  | 'content'
  | 'hiring'
  | 'design'

export interface RouteResult {
  mode: ExpertMode
  confidence: 'high' | 'medium' | 'low'
  detectedKeywords: string[]
  secondaryModes: ExpertMode[]
}

const ROUTING_RULES: Array<{
  mode: ExpertMode
  weight: number
  patterns: RegExp[]
  keywords: string[]
}> = [
  {
    mode: 'code',
    weight: 1.3,
    patterns: [
      /\b(code|coding|program|script|function|class|method|bug|error|debug|refactor|implement|build|develop|engineer)\b/i,
      /\b(typescript|javascript|python|rust|go|java|c\+\+|react|node|express|sql|api|endpoint|component|hook|state)\b/i,
      /\b(syntax|compile|runtime|stacktrace|exception|null|undefined|array|object|loop|recursion|algorithm)\b/i,
      /\b(git|deploy|docker|ci\/cd|test|unit test|integration|lint|eslint|prettier|vitest|jest)\b/i,
      /\b(architecture|monolith|microservice|graphql|grpc|rest|websocket|event-driven|cqrs|ddd)\b/i,
      /```[\s\S]*```/,
      /def |const |let |var |import |export |async |await |return |class |interface |type |enum /,
      /\b(npm|yarn|pnpm|pip|cargo|go mod|maven|gradle)\b/i,
      /\b(database|orm|prisma|drizzle|typeorm|sequelize|mongoose|redis|postgres|mysql|mongodb|sqlite)\b/i,
      /\b(performance|optimize|cache|memory leak|cpu|benchmark|profil|latency|throughput)\b/i,
    ],
    keywords: ['code', 'bug', 'error', 'function', 'debug', 'implement', 'script', 'typescript', 'python', 'javascript', 'refactor', 'api', 'database'],
  },
  {
    mode: 'seo',
    weight: 1.2,
    patterns: [
      /\b(seo|search engine optimization|keywords?|ranking|backlink|serp|sitemap|crawl|index)\b/i,
      /\b(google|bing|traffic|organic search|click.?through|ctr|domain authority|page speed|core web vitals)\b/i,
      /\b(content marketing|blog post|on.?page|off.?page|technical seo|local seo|programmatic seo)\b/i,
      /\b(alt tag|h1|canonical|redirect|301|schema markup|rich snippet|meta description|structured data|json-ld)\b/i,
      /\b(landing page|rank|optimize for search|search visibility|search traffic|keyword research|search intent)\b/i,
      /\b(lcp|cls|inp|fid|e.?e.?a.?t|topical authority|content cluster|pillar page|link building|digital pr)\b/i,
      /\b(google analytics|ga4|search console|semrush|ahrefs|moz|screaming frog|sitebulb)\b/i,
      /\b(featured snippet|knowledge panel|people also ask|zero click|voice search|entity seo)\b/i,
    ],
    keywords: ['seo', 'keywords', 'ranking', 'backlink', 'organic', 'sitemap', 'meta', 'landing page', 'crawl', 'index'],
  },
  {
    mode: 'security',
    weight: 1.3,
    patterns: [
      /\b(security|vulnerability|exploit|hack|attack|penetration|pentest|injection|threat)\b/i,
      /\b(xss|csrf|sql injection|rce|lfi|rfi|ssrf|idor|cors|jwt|auth bypass|broken auth)\b/i,
      /\b(firewall|encryption|ssl|tls|certificate|password|hash|salt|token|secret|key management)\b/i,
      /\b(malware|phishing|ddos|brute force|zero.?day|cve|patch|owasp|cvss|nist)\b/i,
      /\b(secure|insecure|unsafe|protect|harden|audit|threat model|risk|attack surface)\b/i,
      /\b(soc 2|gdpr|hipaa|pci.?dss|iso 27001|compliance|pen test|red team|blue team|zero trust)\b/i,
      /\b(2fa|mfa|oauth|saml|oidc|sso|role.?based|rbac|abac|least privilege)\b/i,
      /\b(api security|rate limit|input validation|output encoding|sanitize|escape|parameterize)\b/i,
    ],
    keywords: ['security', 'vulnerability', 'hack', 'attack', 'secure', 'exploit', 'injection', 'xss', 'auth', 'pentest'],
  },
  {
    mode: 'data',
    weight: 1.1,
    patterns: [
      /\b(data|analyze|analysis|statistics|metrics|kpi|chart|graph|visuali[sz]e|dashboard)\b/i,
      /\b(csv|json|excel|spreadsheet|database|query|aggregate|filter|pivot|etl|pipeline)\b/i,
      /\b(trend|pattern|correlation|regression|average|median|outlier|distribution|variance)\b/i,
      /\b(revenue|mrr|arr|churn|ltv|cac|conversion|funnel|cohort|retention|dau|mau|wau)\b/i,
      /\b(report|dashboard|insight|forecast|predict|model|bi|business intelligence|tableau|looker)\b/i,
      /\b(sql|pandas|numpy|matplotlib|seaborn|plotly|d3|bigquery|snowflake|dbt|airflow)\b/i,
      /\b(a\/b test|experiment|hypothesis|p.?value|significance|sample size|confidence interval)\b/i,
    ],
    keywords: ['data', 'analyze', 'metrics', 'kpi', 'csv', 'statistics', 'trend', 'chart', 'revenue data', 'mrr', 'cohort'],
  },
  {
    mode: 'research',
    weight: 1.0,
    patterns: [
      /\b(research|competitor|competitive|industry|market size|landscape|benchmark|intelligence)\b/i,
      /\b(who is|what is|how does|tell me about|explain|overview of|summary of|deep dive)\b/i,
      /\b(trend|news|recent|latest|current|2024|2025|2026|report|study|survey|whitepaper)\b/i,
      /\b(compare|vs\.?|versus|alternative|option|choice|pros and cons|trade.?off)\b/i,
      /\b(tam|sam|som|market opportunity|competitive intelligence|due diligence|moat|differentiation)\b/i,
      /\b(case study|playbook|framework|strategy|deep research|investigate|analyze market)\b/i,
    ],
    keywords: ['research', 'competitor', 'industry', 'trend', 'market', 'compare', 'explain', 'landscape', 'benchmark'],
  },
  {
    mode: 'finance',
    weight: 1.2,
    patterns: [
      /\b(finance|financial|money|cash|revenue|profit|loss|income|expense|cost|budget|p&l)\b/i,
      /\b(mrr|arr|churn|burn rate|runway|valuation|cap table|equity|dilution|round|shares)\b/i,
      /\b(fundraising|investor|vc|angel|seed|series a|pitch|term sheet|safe|convertible note|priced round)\b/i,
      /\b(accounting|bookkeeping|tax|vat|invoice|payroll|salary|roi|irr|npv|wacc)\b/i,
      /\b(pricing|subscription|freemium|ltv|cac|payback period|gross margin|unit economics|contribution margin)\b/i,
      /\b(balance sheet|cash flow|forecast|projection|model|break.?even|ebitda|rule of 40|quick ratio)\b/i,
      /\b(due diligence|409a|409b|83b election|stock options|esop|liquidation preference|pro.?rata)\b/i,
    ],
    keywords: ['finance', 'revenue', 'profit', 'burn rate', 'runway', 'fundraising', 'investor', 'valuation', 'pricing', 'budget', 'mrr', 'arr'],
  },
  {
    mode: 'product',
    weight: 1.1,
    patterns: [
      /\b(product|feature|roadmap|user story|sprint|backlog|mvp|prototype|wireframe|mockup)\b/i,
      /\b(user experience|ux|ui|design|interface|usability|accessibility|a\/b test|multivariate)\b/i,
      /\b(product.?market fit|pmf|nps|csat|retention|activation|onboarding|churn|north star)\b/i,
      /\b(discovery|validation|hypothesis|experiment|feedback|interview|survey|usability test)\b/i,
      /\b(prioritize|priority|rice|kano|moscow|jobs.?to.?be.?done|jtbd|impact mapping)\b/i,
      /\b(launch|release|v\d|version|milestone|epic|story point|velocity|kanban|scrum)\b/i,
      /\b(prd|product requirements|acceptance criteria|definition of done|technical spec)\b/i,
    ],
    keywords: ['product', 'feature', 'roadmap', 'mvp', 'ux', 'user', 'sprint', 'backlog', 'pmf', 'launch', 'prd', 'onboarding'],
  },
  {
    mode: 'marketing',
    weight: 1.1,
    patterns: [
      /\b(marketing|brand|campaign|content|email|newsletter|ads?|advertising|demand gen)\b/i,
      /\b(copywriting|headline|hook|cta|call to action|conversion|funnel|lead gen|drip)\b/i,
      /\b(facebook|instagram|tiktok|linkedin post|twitter|youtube|influencer|viral|ugc)\b/i,
      /\b(demand gen|growth hack|product hunt|launch|press release|pr|media coverage)\b/i,
      /\b(roas|cpa|cpl|impressions|reach|engagement|click.?through|open rate|ctr)\b/i,
      /\b(seo content|blog strategy|thought leadership|personal brand|positioning|messaging)\b/i,
      /\b(google ads|meta ads|linkedin ads|tiktok ads|programmatic|display|retarget|lookalike)\b/i,
    ],
    keywords: ['marketing', 'brand', 'campaign', 'email', 'content', 'ads', 'viral', 'growth', 'funnels', 'copywriting'],
  },
  {
    mode: 'sales',
    weight: 1.1,
    patterns: [
      /\b(sales|sell|selling|close|closing|deal|pipeline|crm|lead|prospect|outbound|inbound|revenue)\b/i,
      /\b(cold email|cold outreach|linkedin outreach|discovery call|demo|proposal|contract|quote)\b/i,
      /\b(objection|follow.?up|sequence|cadence|quota|commission|forecast|win rate|deal size)\b/i,
      /\b(meddic|meddpicc|spin selling|challenger|consultative|value.?based|enterprise sales|plg)\b/i,
      /\b(salesforce|hubspot|pipedrive|outreach|apollo|clay|zoominfo|linkedin sales navigator)\b/i,
      /\b(icp|ideal customer|buyer persona|champion|economic buyer|procurement|negotiation)\b/i,
    ],
    keywords: ['sales', 'sell', 'deal', 'pipeline', 'lead', 'prospect', 'close', 'outreach', 'crm', 'quota', 'icp'],
  },
  {
    mode: 'devops',
    weight: 1.1,
    patterns: [
      /\b(devops|infrastructure|server|cloud|aws|gcp|azure|kubernetes|k8s|docker|container)\b/i,
      /\b(ci\/cd|github actions|gitlab ci|deploy|deployment|pipeline|terraform|ansible|helm|pulumi)\b/i,
      /\b(monitoring|observability|prometheus|grafana|datadog|logging|alerting|slo|sla|sli|error budget)\b/i,
      /\b(load balancer|cdn|nginx|reverse proxy|ssl cert|domain|dns|vpc|subnet|security group)\b/i,
      /\b(autoscaling|horizontal scaling|microservice|serverless|lambda|edge|vercel|railway|fly\.io)\b/i,
      /\b(incident|postmortem|on.?call|runbook|playbook|chaos engineering|reliability|availability)\b/i,
    ],
    keywords: ['devops', 'infrastructure', 'server', 'cloud', 'aws', 'docker', 'kubernetes', 'deploy', 'ci/cd', 'monitoring'],
  },
  {
    mode: 'legal',
    weight: 1.0,
    patterns: [
      /\b(legal|law|contract|agreement|terms|privacy policy|gdpr|compliance|ip|intellectual property)\b/i,
      /\b(terms of service|tos|eula|nda|non.?disclosure|shareholder|founder agreement|employment)\b/i,
      /\b(trademark|patent|copyright|open source|license|mit|apache|gpl|saas agreement|msa)\b/i,
      /\b(equity|vesting|cliff|409a|83b|cap table|legal entity|incorporation|delaware|c.?corp|llc)\b/i,
      /\b(lawsuit|liability|indemnification|arbitration|jurisdiction|governing law|force majeure)\b/i,
    ],
    keywords: ['legal', 'contract', 'terms', 'privacy', 'gdpr', 'ip', 'trademark', 'compliance', 'nda', 'equity', 'vesting'],
  },
  {
    mode: 'startup',
    weight: 1.0,
    patterns: [
      /\b(startup|business model|market fit|customer discovery|go.?to.?market|gtm|mvp|pivot)\b/i,
      /\b(value prop|value proposition|pitch|vision|mission|co-founder|team building|culture|hiring)\b/i,
      /\b(scale|growth|expansion|acquisition|operations|okr|kpi|yc|accelerator|incubator)\b/i,
      /\b(competitive advantage|moat|differentiation|positioning|category design|disruption)\b/i,
      /\b(problem|solution|customer|market|channel|revenue model|unit economics|traction|pmf)\b/i,
    ],
    keywords: ['startup', 'business', 'strategy', 'market', 'customer', 'growth', 'mvp', 'pivot', 'gtm', 'traction'],
  },
  {
    mode: 'social',
    weight: 1.1,
    patterns: [
      /\b(social media|instagram|tiktok|linkedin post|twitter|youtube shorts|reel|story|thread)\b/i,
      /\b(post|publish|schedule|content calendar|creator|influencer|ugc|hashtag|algorithm)\b/i,
      /\b(followers|engagement|reach|impressions|viral|trending|share|comment|like|subscribe)\b/i,
      /\b(personal brand|thought leader|audience|community|discord|twitter space|linkedin live)\b/i,
      /\b(social strategy|content mix|hook|caption|bio|profile|carousel|video script|reel script)\b/i,
      /\b(grow on|build on|leverage|go viral|trending audio|trending sound|duet|stitch)\b/i,
    ],
    keywords: ['social media', 'instagram', 'tiktok', 'linkedin', 'twitter', 'post', 'reel', 'viral', 'followers', 'creator'],
  },
  {
    mode: 'content',
    weight: 1.1,
    patterns: [
      /\b(write|writing|blog|article|essay|report|copy|content|script|draft|edit|proofread)\b/i,
      /\b(headline|hook|intro|conclusion|cta|call to action|narrative|storytelling|tone|voice)\b/i,
      /\b(email copy|landing page copy|ad copy|product description|bio|about page|press release)\b/i,
      /\b(newsletter|substack|medium|ghost|wordpress|long.?form|short.?form|listicle|how.?to)\b/i,
      /\b(seo.?write|content brief|outline|structure|readability|flesch|grade level|word count)\b/i,
      /\b(persuade|convert|engage|educate|inform|entertain|inspire|story|narrative|arc)\b/i,
    ],
    keywords: ['write', 'blog', 'article', 'copy', 'script', 'draft', 'email copy', 'headline', 'content', 'newsletter'],
  },
  {
    mode: 'hiring',
    weight: 1.0,
    patterns: [
      /\b(hiring|recruit|hire|candidate|interview|job description|jd|talent|team|headcount)\b/i,
      /\b(onboard|culture fit|technical screen|take.?home|assessment|reference check|offer letter)\b/i,
      /\b(salary|comp|compensation|equity|benefits|remote|hybrid|in.?person|relocation)\b/i,
      /\b(linkedin recruiter|greenhouse|lever|ashby|workday|ats|sourcing|inmail|outreach)\b/i,
      /\b(engineer|designer|pm|cto|cmo|vp|director|manager|intern|contractor|freelancer|advisor)\b/i,
      /\b(performance review|pip|okr|goal setting|promotion|leveling|career ladder|fire)\b/i,
    ],
    keywords: ['hiring', 'recruit', 'candidate', 'interview', 'job description', 'talent', 'onboard', 'compensation'],
  },
  {
    mode: 'design',
    weight: 1.0,
    patterns: [
      /\b(design|ui|ux|figma|wireframe|mockup|prototype|design system|component|style guide)\b/i,
      /\b(color|typography|font|spacing|layout|grid|responsive|mobile.?first|breakpoint)\b/i,
      /\b(user flow|journey map|persona|empathy map|heuristic|usability|accessibility|wcag|a11y)\b/i,
      /\b(branding|logo|visual identity|brand kit|color palette|icon|illustration|motion)\b/i,
      /\b(tailwind|css|sass|styled.?components|shadcn|radix|chakra|material|ant design|headless ui)\b/i,
      /\b(landing page design|cro|above the fold|hero|above.?the.?fold|conversion rate|visual hierarchy)\b/i,
    ],
    keywords: ['design', 'ui', 'ux', 'figma', 'wireframe', 'branding', 'color', 'typography', 'layout', 'accessibility'],
  },
]

export function detectExpertMode(message: string): RouteResult {
  const scores: Record<ExpertMode, number> = {
    code: 0, seo: 0, security: 0, data: 0, research: 0,
    finance: 0, product: 0, startup: 0, founder: 0,
    marketing: 0, sales: 0, devops: 0, legal: 0,
    social: 0, content: 0, hiring: 0, design: 0,
  }

  const detected: Record<ExpertMode, string[]> = {
    code: [], seo: [], security: [], data: [], research: [],
    finance: [], product: [], startup: [], founder: [],
    marketing: [], sales: [], devops: [], legal: [],
    social: [], content: [], hiring: [], design: [],
  }

  for (const rule of ROUTING_RULES) {
    for (const pattern of rule.patterns) {
      const matches = message.match(pattern)
      if (matches) {
        // Weight longer/more specific matches higher
        const matchWeight = matches[0].length > 10 ? 2 : 1
        scores[rule.mode] += matches.length * matchWeight * rule.weight
        detected[rule.mode].push(...matches.slice(0, 2).map(m => m.trim()))
      }
    }
  }

  // Find top mode
  let topMode: ExpertMode = 'founder'
  let topScore = 0
  const modeEntries = Object.entries(scores) as [ExpertMode, number][]
  for (const [mode, score] of modeEntries) {
    if (score > topScore) {
      topScore = score
      topMode = mode
    }
  }

  // Find secondary modes (score > 30% of top score, and > 0)
  const threshold = topScore * 0.3
  const secondaryModes = modeEntries
    .filter(([mode, score]) => mode !== topMode && score >= threshold && score > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([mode]) => mode)

  const confidence = topScore >= 4 ? 'high' : topScore >= 1.5 ? 'medium' : 'low'

  return {
    mode: topScore === 0 ? 'founder' : topMode,
    confidence,
    detectedKeywords: [...new Set(detected[topMode])].slice(0, 5),
    secondaryModes,
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
  social: '📱 Social Media Agent',
  content: '✍️ Content Agent',
  hiring: '🎯 Talent Agent',
  design: '🎨 Design Agent',
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
  social: 'violet',
  content: 'teal',
  hiring: 'lime',
  design: 'fuchsia',
}
