/**
 * Web Search utility — gives the AI real-time knowledge about trends,
 * competitors, market data, and news WITHOUT any API key.
 * Uses DuckDuckGo Instant Answer API + Google News RSS.
 */

export interface SearchResult {
  title: string
  snippet: string
  url?: string
}

export interface WebContext {
  query: string
  instantAnswer?: string
  results: SearchResult[]
  news: SearchResult[]
  relatedTopics: string[]
  fetchedAt: string
}

const FETCH_TIMEOUT = 8000

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * DuckDuckGo Instant Answer API (no key required)
 */
async function duckduckgoSearch(query: string): Promise<{
  instantAnswer?: string
  relatedTopics: string[]
  results: SearchResult[]
}> {
  try {
    const encoded = encodeURIComponent(query)
    const url = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_redirect=1&no_html=1&skip_disambig=1`
    const res = await fetchWithTimeout(url)
    if (!res.ok) return { relatedTopics: [], results: [] }

    const data = await res.json() as any

    const instantAnswer = data.AbstractText || data.Answer || data.Definition || undefined

    const relatedTopics: string[] = (data.RelatedTopics || [])
      .slice(0, 8)
      .map((t: any) => t.Text || t.Name || '')
      .filter(Boolean)

    const results: SearchResult[] = (data.Results || [])
      .slice(0, 5)
      .map((r: any) => ({
        title: r.Text || '',
        snippet: r.Text || '',
        url: r.FirstURL || '',
      }))
      .filter((r: SearchResult) => r.title)

    return { instantAnswer, relatedTopics, results }
  } catch {
    return { relatedTopics: [], results: [] }
  }
}

/**
 * Google News RSS (no key required) — gets latest news headlines
 */
async function fetchGoogleNews(query: string): Promise<SearchResult[]> {
  try {
    const encoded = encodeURIComponent(query)
    const url = `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`
    const res = await fetchWithTimeout(url)
    if (!res.ok) return []

    const xml = await res.text()

    const items: SearchResult[] = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match

    while ((match = itemRegex.exec(xml)) !== null && items.length < 6) {
      const block = match[1]
      const titleMatch = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/)
      const descMatch = block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || block.match(/<description>(.*?)<\/description>/)
      const linkMatch = block.match(/<link>(.*?)<\/link>/)

      if (titleMatch) {
        items.push({
          title: titleMatch[1].trim(),
          snippet: descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim().substring(0, 200) : '',
          url: linkMatch ? linkMatch[1].trim() : undefined,
        })
      }
    }

    return items
  } catch {
    return []
  }
}

/**
 * Main function — gather web context for any topic/query.
 * Used to inject real-time knowledge into AI prompts.
 */
export async function gatherWebContext(query: string, includeNews = true): Promise<WebContext> {
  const [ddg, news] = await Promise.all([
    duckduckgoSearch(query),
    includeNews ? fetchGoogleNews(query) : Promise.resolve([]),
  ])

  return {
    query,
    instantAnswer: ddg.instantAnswer,
    results: ddg.results,
    news,
    relatedTopics: ddg.relatedTopics,
    fetchedAt: new Date().toISOString(),
  }
}

/**
 * Formats web context into a string block to inject into AI system prompts.
 */
export function formatWebContextForPrompt(ctx: WebContext): string {
  const lines: string[] = [
    `=== REAL-TIME WEB CONTEXT (fetched ${new Date(ctx.fetchedAt).toLocaleDateString()}) ===`,
    `Query: "${ctx.query}"`,
  ]

  if (ctx.instantAnswer) {
    lines.push(`\nInstant Answer: ${ctx.instantAnswer}`)
  }

  if (ctx.news.length > 0) {
    lines.push('\nLATEST NEWS & TRENDS:')
    ctx.news.slice(0, 5).forEach((n, i) => {
      lines.push(`${i + 1}. ${n.title}${n.snippet ? ` — ${n.snippet}` : ''}`)
    })
  }

  if (ctx.relatedTopics.length > 0) {
    lines.push('\nRELATED TOPICS & MARKET SIGNALS:')
    ctx.relatedTopics.forEach(t => lines.push(`• ${t}`))
  }

  if (ctx.results.length > 0) {
    lines.push('\nKEY RESULTS:')
    ctx.results.forEach((r, i) => lines.push(`${i + 1}. ${r.title}`))
  }

  lines.push('=== END WEB CONTEXT ===')
  lines.push('Use the above real-time data to inform your analysis. Cite specific trends and news where relevant.')

  return lines.join('\n')
}

/**
 * Quick helper: fetch web context and return formatted string.
 */
export async function getWebContextString(query: string): Promise<string> {
  try {
    const ctx = await gatherWebContext(query)
    return formatWebContextForPrompt(ctx)
  } catch {
    return ''
  }
}
