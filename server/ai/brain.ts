import { detectExpertMode, type ExpertMode, type RouteResult } from './router'
import { enhancePrompt } from './promptEnhancer'
import { getAIProvider } from './index'
import { assembleFounderContext, buildSystemPromptWithContext } from './context'
import { extractAndStoreMemories } from './memory'
import { gatherWebContext, formatWebContextForPrompt } from './webSearch'
import { db } from '../db'
import { chatMessages } from '../db/schema'
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
  webSearchUsed: boolean
}

export interface BrainStreamChunk {
  type: 'mode' | 'token' | 'done' | 'error'
  data: string | Partial<BrainResponse>
}

const MODE_LABELS: Record<ExpertMode, string> = {
  code: '💻 Code Expert',
  seo: '🔍 SEO Expert',
  security: '🔒 Security Expert',
  data: '📊 Data Analyst',
  research: '🔬 Research Expert',
  startup: '🚀 Startup Advisor',
  founder: '🧠 Founder AI',
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
      ? { mode: req.forcedMode, confidence: 'high' as const, detectedKeywords: [] }
      : detectExpertMode(req.message)

    const { systemPrompt: expertSystemPrompt, enhancedMessage } = enhancePrompt(req.message, route.mode)

    let founderSystemPrompt = expertSystemPrompt
    try {
      const context = await assembleFounderContext(req.userId)
      founderSystemPrompt = buildSystemPromptWithContext(expertSystemPrompt, context)
    } catch {}

    let webSearchUsed = false
    let finalSystemPrompt = founderSystemPrompt

    const shouldSearchWeb = req.useWebSearch !== false && (
      route.mode === 'research' ||
      route.mode === 'seo' ||
      route.mode === 'startup' ||
      /\b(trend|news|recent|latest|current|competitor|market|industry)\b/i.test(req.message)
    )

    if (shouldSearchWeb) {
      try {
        const webCtx = await gatherWebContext(req.message)
        if (webCtx.length > 0) {
          finalSystemPrompt = founderSystemPrompt + '\n\n' + formatWebContextForPrompt(webCtx)
          webSearchUsed = true
        }
      } catch {}
    }

    const history = await db.select().from(chatMessages)
      .where(and(eq(chatMessages.userId, req.userId), eq(chatMessages.sessionId, session)))
      .orderBy(chatMessages.createdAt)

    const messages = [
      { role: 'system' as const, content: finalSystemPrompt },
      ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    ]

    const lastUserMsg = messages[messages.length - 1]
    if (lastUserMsg && lastUserMsg.role === 'user') {
      lastUserMsg.content = enhancedMessage
    }

    const ai = await getAIProvider()
    const response = await ai.chat(messages)

    await db.insert(chatMessages).values({
      userId: req.userId,
      sessionId: session,
      role: 'assistant',
      content: response,
      model: `brain:${route.mode}`,
    })

    extractAndStoreMemories(req.userId, req.message, response, `brain:${route.mode}`).catch(() => {})

    return {
      response,
      sessionId: session,
      mode: route.mode,
      modeLabel: MODE_LABELS[route.mode],
      confidence: route.confidence,
      detectedKeywords: route.detectedKeywords,
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
      ? { mode: req.forcedMode, confidence: 'high' as const, detectedKeywords: [] }
      : detectExpertMode(req.message)

    yield { type: 'mode', data: JSON.stringify({ mode: route.mode, modeLabel: MODE_LABELS[route.mode], sessionId: session }) }

    const { systemPrompt: expertSystemPrompt, enhancedMessage } = enhancePrompt(req.message, route.mode)

    let finalSystemPrompt = expertSystemPrompt
    let webSearchUsed = false
    try {
      const context = await assembleFounderContext(req.userId)
      finalSystemPrompt = buildSystemPromptWithContext(expertSystemPrompt, context)
    } catch {}

    const shouldSearchWeb = req.useWebSearch !== false && (
      route.mode === 'research' || route.mode === 'seo' || route.mode === 'startup' ||
      /\b(trend|news|recent|latest|competitor|market)\b/i.test(req.message)
    )

    if (shouldSearchWeb) {
      try {
        const webCtx = await gatherWebContext(req.message)
        if (webCtx.length > 0) {
          finalSystemPrompt = finalSystemPrompt + '\n\n' + formatWebContextForPrompt(webCtx)
          webSearchUsed = true
        }
      } catch {}
    }

    const history = await db.select().from(chatMessages)
      .where(and(eq(chatMessages.userId, req.userId), eq(chatMessages.sessionId, session)))
      .orderBy(chatMessages.createdAt)

    const messages = [
      { role: 'system' as const, content: finalSystemPrompt },
      ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    ]

    const lastUserMsg = messages[messages.length - 1]
    if (lastUserMsg && lastUserMsg.role === 'user') {
      lastUserMsg.content = enhancedMessage
    }

    try {
      const ai = await getAIProvider()
      const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
      const ollamaModel = req.model || process.env.OLLAMA_MODEL || 'llama3.2'

      let fullResponse = ''

      try {
        const streamRes = await fetch(`${ollamaBaseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: ollamaModel, messages, stream: true }),
          signal: AbortSignal.timeout(120000),
        })

        if (!streamRes.ok || !streamRes.body) throw new Error('Stream not available')

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
            } catch {}
          }
        }
      } catch {
        const response = await ai.chat(messages)
        fullResponse = response
        for (const word of response.split(' ')) {
          yield { type: 'token', data: word + ' ' }
          await new Promise(r => setTimeout(r, 10))
        }
      }

      await db.insert(chatMessages).values({
        userId: req.userId,
        sessionId: session,
        role: 'assistant',
        content: fullResponse,
        model: `brain:${route.mode}`,
      }).catch(() => {})

      extractAndStoreMemories(req.userId, req.message, fullResponse, `brain:${route.mode}`).catch(() => {})

      yield {
        type: 'done',
        data: JSON.stringify({
          sessionId: session,
          mode: route.mode,
          modeLabel: MODE_LABELS[route.mode],
          confidence: route.confidence,
          webSearchUsed,
        }),
      }
    } catch (err: any) {
      yield { type: 'error', data: err.message || 'AI request failed' }
    }
  }
}

export const brain = new OneFounderBrain()
