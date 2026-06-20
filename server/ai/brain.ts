import { detectExpertMode, type ExpertMode, type RouteResult } from './router.js'
import { enhancePrompt } from './promptEnhancer.js'
import { getAIProvider } from './index.js'
import { assembleFounderContext, type FounderContext } from './context.js'
import { extractAndStoreMemories } from './memory.js'
import { extractEntitiesFromConversation } from '../knowledge/entityExtractor.js'
import { getMemoryContextForQuery } from '../memory/memoryRetrieval.js'
import { assembleRAGContext } from '../rag/contextAssembler.js'
import { gatherWebContext, formatWebContextForPrompt } from './webSearch.js'
import { db } from '../db/index.js'
import { chatMessages } from '../db/schema.js'
import { eq, and, desc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export interface BrainRequest {
  userId: string
  message: string
  sessionId?: string
  forcedMode?: ExpertMode
  useWebSearch?: boolean
  model?: string
  maxHistory?: number          // cap conversation turns sent to model (default: 20)
}

export interface BrainResponse {
  response: string
  sessionId: string
  mode: ExpertMode
  modeLabel: string
  confidence: 'high' | 'medium' | 'low'
  detectedKeywords: string[]
  secondaryModes: ExpertMode[]
  webSearchUsed: boolean
  contextSources: string[]     // what context sources were injected (memory, rag, web, founder)
}

export interface BrainStreamChunk {
  type: 'mode' | 'token' | 'done' | 'error'
  data: string | Partial<BrainResponse>
}

const MODE_LABELS: Record<ExpertMode, string> = {
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

// Modes that should always trigger a web search
const WEB_SEARCH_MODES = new Set<ExpertMode>(['research', 'seo', 'startup', 'data', 'marketing'])

// Regex that triggers web search regardless of mode
const WEB_SEARCH_PATTERNS = /\b(trend|news|recent|latest|current|competitor|market|industry|2024|2025|2026|price of|who is ceo|who leads|who founded|how much is|stock|funding|launched|released|announced|acquired)\b/i

function formatContext(ctx: FounderContext): string {
  const parts = [
    `Founder Stage: ${ctx.stage} | Industry: ${ctx.industry} | Goal: ${ctx.goals}`,
    ctx.businessSnapshot ? `Business Snapshot:\n${ctx.businessSnapshot}` : '',
    ctx.financialContext ? `Financial Context: ${ctx.financialContext}` : '',
    ctx.urgentItems && ctx.urgentItems !== 'No urgent items flagged'
      ? `Urgent Items:\n${ctx.urgentItems}` : '',
    ctx.memories ? `Persistent Memories:\n${ctx.memories}` : '',
    ctx.recentActivity ? `Recent Activity: ${ctx.recentActivity}` : '',
  ]
  return parts.filter(Boolean).join('\n\n')
}

/** Trim history to the most recent N turns while always keeping the first user message for session continuity */
function trimHistory(
  history: Array<{ role: string; content: string }>,
  maxTurns: number
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const mapped = history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
  if (mapped.length <= maxTurns * 2) return mapped
  // Keep first message + most recent (maxTurns * 2 - 1) messages
  return [mapped[0], ...mapped.slice(-(maxTurns * 2 - 1))]
}

async function buildContextSources(
  userId: string,
  message: string,
  route: RouteResult,
  useWebSearch: boolean
): Promise<{
  founderContext?: string
  memoryContext: string
  ragContext: string
  webContext: string
  webSearchUsed: boolean
  contextSources: string[]
}> {
  const [ctx, memCtx, ragCtx] = await Promise.all([
    assembleFounderContext(userId).catch(() => null),
    getMemoryContextForQuery(userId, message).catch(() => ''),
    assembleRAGContext(userId, message).catch(() => ''),
  ])

  const founderContext = ctx ? formatContext(ctx) : undefined
  const memoryContext = memCtx ?? ''
  const ragContext = ragCtx ?? ''
  const contextSources: string[] = []

  if (founderContext) contextSources.push('founder_profile')
  if (memoryContext) contextSources.push('ai_memory')
  if (ragContext) contextSources.push('knowledge_base')

  let webContext = ''
  let webSearchUsed = false

  const shouldSearchWeb = useWebSearch && (
    WEB_SEARCH_MODES.has(route.mode) ||
    WEB_SEARCH_PATTERNS.test(message)
  )

  if (shouldSearchWeb) {
    try {
      const webCtx = await gatherWebContext(message)
      if (webCtx.results.length > 0 || webCtx.news.length > 0) {
        webContext = formatWebContextForPrompt(webCtx)
        webSearchUsed = true
        contextSources.push('web_search')
      }
    } catch {}
  }

  return { founderContext, memoryContext, ragContext, webContext, webSearchUsed, contextSources }
}

function assembleSystemPrompt(
  base: string,
  memoryContext: string,
  ragContext: string,
  webContext: string
): string {
  let prompt = base
  if (memoryContext) prompt += `\n\n${memoryContext}`
  if (ragContext) prompt += `\n\n${ragContext}`
  if (webContext) prompt += `\n\n${webContext}`
  return prompt
}

export class OneFounderBrain {

  async process(req: BrainRequest): Promise<BrainResponse> {
    const session = req.sessionId || uuidv4()
    const maxHistory = req.maxHistory ?? 20

    // Persist user message
    await db.insert(chatMessages).values({
      userId: req.userId,
      sessionId: session,
      role: 'user',
      content: req.message,
      model: 'brain',
    }).catch(() => {})

    const route = req.forcedMode
      ? { mode: req.forcedMode, confidence: 'high' as const, detectedKeywords: [], secondaryModes: [] }
      : detectExpertMode(req.message)

    // Build all context in parallel
    const {
      founderContext, memoryContext, ragContext, webContext, webSearchUsed, contextSources,
    } = await buildContextSources(req.userId, req.message, route, req.useWebSearch !== false)

    const { systemPrompt, enhancedMessage } = enhancePrompt(
      req.message, route.mode, founderContext, route.secondaryModes
    )

    const finalSystemPrompt = assembleSystemPrompt(systemPrompt, memoryContext, ragContext, webContext)

    // Load conversation history (trimmed)
    const rawHistory = await db.select()
      .from(chatMessages)
      .where(and(eq(chatMessages.userId, req.userId), eq(chatMessages.sessionId, session)))
      .orderBy(chatMessages.createdAt)
      .catch(() => [])

    const history = trimHistory(rawHistory, maxHistory)

    const messages = [
      { role: 'system' as const, content: finalSystemPrompt },
      ...history,
    ]

    // Replace last user message with enhanced version
    const lastUser = messages.findLastIndex(m => m.role === 'user')
    if (lastUser !== -1) messages[lastUser].content = enhancedMessage

    const ai = await getAIProvider()
    const chatResponse = await ai.chat(messages)
    const response = chatResponse.content

    // Persist assistant response
    await db.insert(chatMessages).values({
      userId: req.userId,
      sessionId: session,
      role: 'assistant',
      content: response,
      model: `brain:${route.mode}`,
    }).catch(() => {})

    // Fire-and-forget enrichment — never block the response
    Promise.all([
      extractAndStoreMemories(req.userId, req.message, response, `brain:${route.mode}`),
      extractEntitiesFromConversation(req.userId, req.message, response),
    ]).catch(() => {})

    return {
      response,
      sessionId: session,
      mode: route.mode,
      modeLabel: MODE_LABELS[route.mode],
      confidence: route.confidence,
      detectedKeywords: route.detectedKeywords,
      secondaryModes: route.secondaryModes ?? [],
      webSearchUsed,
      contextSources,
    }
  }

  async *stream(req: BrainRequest): AsyncGenerator<BrainStreamChunk> {
    const session = req.sessionId || uuidv4()
    const maxHistory = req.maxHistory ?? 20

    await db.insert(chatMessages).values({
      userId: req.userId,
      sessionId: session,
      role: 'user',
      content: req.message,
      model: 'brain',
    }).catch(() => {})

    const route = req.forcedMode
      ? { mode: req.forcedMode, confidence: 'high' as const, detectedKeywords: [], secondaryModes: [] }
      : detectExpertMode(req.message)

    yield {
      type: 'mode',
      data: JSON.stringify({
        mode: route.mode,
        modeLabel: MODE_LABELS[route.mode],
        sessionId: session,
        secondaryModes: route.secondaryModes ?? [],
      }),
    }

    // Build all context in parallel before first token
    const {
      founderContext, memoryContext, ragContext, webContext, webSearchUsed, contextSources,
    } = await buildContextSources(req.userId, req.message, route, req.useWebSearch !== false)

    const { systemPrompt, enhancedMessage } = enhancePrompt(
      req.message, route.mode, founderContext, route.secondaryModes
    )

    const finalSystemPrompt = assembleSystemPrompt(systemPrompt, memoryContext, ragContext, webContext)

    const rawHistory = await db.select()
      .from(chatMessages)
      .where(and(eq(chatMessages.userId, req.userId), eq(chatMessages.sessionId, session)))
      .orderBy(chatMessages.createdAt)
      .catch(() => [])

    const history = trimHistory(rawHistory, maxHistory)

    const messages = [
      { role: 'system' as const, content: finalSystemPrompt },
      ...history,
    ]

    const lastUser = messages.findLastIndex(m => m.role === 'user')
    if (lastUser !== -1) messages[lastUser].content = enhancedMessage

    let fullResponse = ''

    try {
      const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
      const ollamaModel = req.model || process.env.OLLAMA_MODEL || 'qwen3:8b'
      let ollamaStreamed = false

      // Attempt streaming from Ollama
      try {
        const streamRes = await fetch(`${ollamaBaseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ollamaModel,
            messages,
            stream: true,
            options: {
              // Conservative settings for reliable structured output
              temperature: 0.7,
              top_p: 0.9,
              repeat_penalty: 1.1,
            },
          }),
          signal: AbortSignal.timeout(180_000),  // 3 min for complex responses
        })

        if (streamRes.ok && streamRes.body) {
          const reader = streamRes.body.getReader()
          const decoder = new TextDecoder()

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n').filter(l => l.trim())

            for (const line of lines) {
              try {
                const parsed = JSON.parse(line)
                const token = parsed.message?.content || ''
                if (token) {
                  fullResponse += token
                  yield { type: 'token', data: token }
                }
                // Ollama signals stream end with done: true
                if (parsed.done === true) {
                  ollamaStreamed = true
                }
              } catch {}
            }
          }
          if (!ollamaStreamed && fullResponse.length > 0) ollamaStreamed = true
        }
      } catch {
        // Ollama unreachable — fall through to provider fallback
      }

      // Fallback: non-streaming via registered AI provider
      if (!ollamaStreamed) {
        const ai = await getAIProvider()
        const chatResponse = await ai.chat(messages)
        fullResponse = chatResponse.content
        // Simulate streaming for consistent UX (word by word, ~80 WPM equivalent)
        const words = fullResponse.split(' ')
        for (const word of words) {
          yield { type: 'token', data: word + ' ' }
          await new Promise(r => setTimeout(r, 10))
        }
      }

      // Persist the complete response
      await db.insert(chatMessages).values({
        userId: req.userId,
        sessionId: session,
        role: 'assistant',
        content: fullResponse,
        model: `brain:${route.mode}`,
      }).catch(() => {})

      // Fire-and-forget enrichment
      Promise.all([
        extractAndStoreMemories(req.userId, req.message, fullResponse, `brain:${route.mode}`),
        extractEntitiesFromConversation(req.userId, req.message, fullResponse),
      ]).catch(() => {})

      yield {
        type: 'done',
        data: JSON.stringify({
          sessionId: session,
          mode: route.mode,
          modeLabel: MODE_LABELS[route.mode],
          confidence: route.confidence,
          detectedKeywords: route.detectedKeywords,
          secondaryModes: route.secondaryModes ?? [],
          webSearchUsed,
          contextSources,
        }),
      }
    } catch (err: any) {
      yield { type: 'error', data: err.message || 'AI request failed' }
    }
  }
}

export const brain = new OneFounderBrain()
