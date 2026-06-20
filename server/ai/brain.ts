import { detectExpertMode, type ExpertMode, type RouteResult, MODE_LABELS } from './router.js'
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
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export interface BrainRequest {
  userId: string
  message: string
  sessionId?: string
  forcedMode?: ExpertMode
  useWebSearch?: boolean
  model?: string
}

export interface BrainResponse {
  response: string
  sessionId: string
  mode: ExpertMode
  modeLabel: string
  confidence: 'high' | 'medium' | 'low'
  detectedKeywords: string[]
  secondaryModes: ExpertMode[]
  contextSources: string[]
  webSearchUsed: boolean
}

export interface BrainStreamChunk {
  type: 'mode' | 'token' | 'done' | 'error'
  data: string | Partial<BrainResponse>
}

function formatContext(ctx: FounderContext): string {
  return [
    `Founder Stage: ${ctx.stage} | Industry: ${ctx.industry} | Goal: ${ctx.goals}`,
    `Business Snapshot:\n${ctx.businessSnapshot}`,
    `Financial Context: ${ctx.financialContext}`,
    ctx.urgentItems !== 'No urgent items flagged' ? `Urgent Items:\n${ctx.urgentItems}` : '',
    `Persistent Memories:\n${ctx.memories}`,
    `Recent Activity: ${ctx.recentActivity}`,
  ].filter(Boolean).join('\n\n')
}

export class OneFounderBrain {
  async process(req: BrainRequest): Promise<BrainResponse> {
    const session = req.sessionId || uuidv4()

    await db.insert(chatMessages).values({
      userId: req.userId,
      sessionId: session,
      role: 'user',
      content: req.message,
      model: 'brain',
    })

    const route = req.forcedMode
      ? { mode: req.forcedMode, confidence: 'high' as const, detectedKeywords: [], secondaryModes: [] as ExpertMode[] }
      : detectExpertMode(req.message)

    // Build context in parallel: founder context, memory retrieval, RAG
    let founderContext: string | undefined
    let memoryContext = ''
    let ragContext = ''

    try {
      const [ctx, memCtx, ragCtx] = await Promise.all([
        assembleFounderContext(req.userId).catch((e) => { console.warn('[Brain] Context assembly failed:', e.message); return null }),
        getMemoryContextForQuery(req.userId, req.message).catch((e) => { console.warn('[Brain] Memory retrieval failed:', e.message); return '' }),
        assembleRAGContext(req.userId, req.message).catch((e) => { console.warn('[Brain] RAG assembly failed:', e.message); return '' }),
      ])
      if (ctx) founderContext = formatContext(ctx)
      memoryContext = memCtx
      ragContext = ragCtx
    } catch (e: any) { console.warn('[Brain] Context build error:', e.message) }

    const { systemPrompt, enhancedMessage } = enhancePrompt(req.message, route.mode, founderContext)

    let finalSystemPrompt = systemPrompt
    if (memoryContext) finalSystemPrompt += `\n\n${memoryContext}`
    if (ragContext) finalSystemPrompt += `\n\n${ragContext}`

    let webSearchUsed = false

    const shouldSearchWeb = req.useWebSearch !== false && (
      route.mode === 'research' ||
      route.mode === 'seo' ||
      route.mode === 'startup' ||
      /\b(trend|news|recent|latest|current|competitor|market|industry)\b/i.test(req.message)
    )

    if (shouldSearchWeb) {
      try {
        const webCtx = await gatherWebContext(req.message)
        if (webCtx.results.length > 0 || webCtx.news.length > 0) {
          finalSystemPrompt = finalSystemPrompt + '\n\n' + formatWebContextForPrompt(webCtx)
          webSearchUsed = true
        }
      } catch {}
    }

    // Window to last 50 messages to stay within model context limits
    const history = await db.select().from(chatMessages)
      .where(and(eq(chatMessages.userId, req.userId), eq(chatMessages.sessionId, session)))
      .orderBy(chatMessages.createdAt)
      .limit(50)

    const messages = [
      { role: 'system' as const, content: finalSystemPrompt },
      ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ]

    const lastUserMsg = messages[messages.length - 1]
    if (lastUserMsg?.role === 'user') {
      lastUserMsg.content = enhancedMessage
    }

    const ai = await getAIProvider()
    const chatResponse = await ai.chat(messages)
    const response = chatResponse.content

    await db.insert(chatMessages).values({
      userId: req.userId,
      sessionId: session,
      role: 'assistant',
      content: response,
      model: `brain:${route.mode}`,
    })

    // Fire-and-forget memory + entity extraction
    extractAndStoreMemories(req.userId, req.message, response, `brain:${route.mode}`).catch(() => {})
    extractEntitiesFromConversation(req.userId, req.message, response).catch(() => {})

    // Determine context sources used
    const contextSources: string[] = []
    if (founderContext) contextSources.push('founder_context')
    if (memoryContext) contextSources.push('memory')
    if (ragContext) contextSources.push('rag')
    if (webSearchUsed) contextSources.push('web_search')

    return {
      response,
      sessionId: session,
      mode: route.mode,
      modeLabel: MODE_LABELS[route.mode],
      confidence: route.confidence,
      detectedKeywords: route.detectedKeywords,
      secondaryModes: route.secondaryModes || [],
      contextSources,
      webSearchUsed,
    }
  }

  async *stream(req: BrainRequest): AsyncGenerator<BrainStreamChunk> {
    const session = req.sessionId || uuidv4()

    await db.insert(chatMessages).values({
      userId: req.userId,
      sessionId: session,
      role: 'user',
      content: req.message,
      model: 'brain',
    }).catch(() => {})

    const route = req.forcedMode
      ? { mode: req.forcedMode, confidence: 'high' as const, detectedKeywords: [], secondaryModes: [] as ExpertMode[] }
      : detectExpertMode(req.message)

    yield { type: 'mode', data: JSON.stringify({ mode: route.mode, modeLabel: MODE_LABELS[route.mode], sessionId: session }) }

    // Build all context in parallel before responding
    let founderContext: string | undefined
    let memoryContext = ''
    let ragContext = ''

    try {
      const [ctx, memCtx, ragCtx] = await Promise.all([
        assembleFounderContext(req.userId).catch((e) => { console.warn('[Brain] Context assembly failed:', e.message); return null }),
        getMemoryContextForQuery(req.userId, req.message).catch((e) => { console.warn('[Brain] Memory retrieval failed:', e.message); return '' }),
        assembleRAGContext(req.userId, req.message).catch((e) => { console.warn('[Brain] RAG assembly failed:', e.message); return '' }),
      ])
      if (ctx) founderContext = formatContext(ctx)
      memoryContext = memCtx
      ragContext = ragCtx
    } catch (e: any) { console.warn('[Brain] Context build error:', e.message) }

    const { systemPrompt, enhancedMessage } = enhancePrompt(req.message, route.mode, founderContext)

    let finalSystemPrompt = systemPrompt
    if (memoryContext) finalSystemPrompt += `\n\n${memoryContext}`
    if (ragContext) finalSystemPrompt += `\n\n${ragContext}`

    let webSearchUsed = false

    const shouldSearchWeb = req.useWebSearch !== false && (
      route.mode === 'research' || route.mode === 'seo' || route.mode === 'startup' ||
      /\b(trend|news|recent|latest|competitor|market)\b/i.test(req.message)
    )

    if (shouldSearchWeb) {
      try {
        const webCtx = await gatherWebContext(req.message)
        if (webCtx.results.length > 0 || webCtx.news.length > 0) {
          finalSystemPrompt = finalSystemPrompt + '\n\n' + formatWebContextForPrompt(webCtx)
          webSearchUsed = true
        }
      } catch {}
    }

    // Window to last 50 messages to stay within model context limits
    const history = await db.select().from(chatMessages)
      .where(and(eq(chatMessages.userId, req.userId), eq(chatMessages.sessionId, session)))
      .orderBy(chatMessages.createdAt)
      .limit(50)

    const messages = [
      { role: 'system' as const, content: finalSystemPrompt },
      ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ]

    const lastUserMsg = messages[messages.length - 1]
    if (lastUserMsg?.role === 'user') {
      lastUserMsg.content = enhancedMessage
    }

    try {
      let fullResponse = ''
      let streamed = false

      // Use the provider registry — handles Ollama, fallbacks, retries, timeouts
      try {
        const ai = await getAIProvider()
        const streamOptions = req.model ? { model: req.model } : undefined
        const streamGen = ai.stream(messages, streamOptions)

        for await (const chunk of streamGen) {
          if (chunk.type === 'token') {
            fullResponse += chunk.data
            yield { type: 'token', data: chunk.data }
          } else if (chunk.type === 'error') {
            throw new Error(chunk.data)
          }
        }
        streamed = true
      } catch (streamErr: any) {
        console.warn('[Brain] Streaming failed, trying non-streaming:', streamErr.message)
      }

      if (!streamed) {
        const ai = await getAIProvider()
        const chatOptions = req.model ? { model: req.model } : undefined
        const chatResponse = await ai.chat(messages, chatOptions)
        fullResponse = chatResponse.content
        for (const word of fullResponse.split(' ')) {
          yield { type: 'token', data: word + ' ' }
          await new Promise(r => setTimeout(r, 8))
        }
      }

      await db.insert(chatMessages).values({
        userId: req.userId,
        sessionId: session,
        role: 'assistant',
        content: fullResponse,
        model: `brain:${route.mode}`,
      }).catch(() => {})

      // Fire-and-forget enrichment
      extractAndStoreMemories(req.userId, req.message, fullResponse, `brain:${route.mode}`).catch(() => {})
      extractEntitiesFromConversation(req.userId, req.message, fullResponse).catch(() => {})

      const contextSources: string[] = []
      if (founderContext) contextSources.push('founder_context')
      if (memoryContext) contextSources.push('memory')
      if (ragContext) contextSources.push('rag')
      if (webSearchUsed) contextSources.push('web_search')

      yield {
        type: 'done',
        data: JSON.stringify({
          sessionId: session,
          mode: route.mode,
          modeLabel: MODE_LABELS[route.mode],
          confidence: route.confidence,
          secondaryModes: route.secondaryModes || [],
          contextSources,
          webSearchUsed,
        }),
      }
    } catch (err: any) {
      yield { type: 'error', data: err.message || 'AI request failed' }
    }
  }
}

export const brain = new OneFounderBrain()
