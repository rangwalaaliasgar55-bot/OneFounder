import type { AIProvider, AIModel, AIMessage, ChatOptions, ChatResponse, StreamChunk, ProviderStatus, ProviderType } from '../types.js'
import { AIOfflineError, AITimeoutError } from '../types.js'

const DEFAULT_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-4o-mini'
const REQUEST_TIMEOUT = 60000
const HEALTH_CHECK_TIMEOUT = 10000
const MAX_RETRIES = 2

// Models known to support chat completions
const CHAT_CAPABLE_PREFIXES = [
  'gpt-4', 'gpt-3.5', 'o1', 'o3', 'o4', 'chatgpt',
]

export class OpenAIProvider implements AIProvider {
  readonly name = 'OpenAI'
  readonly type: ProviderType = 'openai'
  readonly baseUrl: string
  private defaultModel: string
  private apiKey: string
  private lastHealthCheck: { available: boolean; timestamp: number } | null = null
  private readonly HEALTH_CACHE_TTL = 10000

  constructor(baseUrl?: string, model?: string, apiKey?: string) {
    this.baseUrl = baseUrl || process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL
    this.defaultModel = model || process.env.OPENAI_MODEL || DEFAULT_MODEL
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || ''

    if (!this.apiKey) {
      console.warn('[OpenAI] No API key provided. Set OPENAI_API_KEY environment variable.')
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + this.apiKey,
    }
  }

  async isAvailable(): Promise<boolean> {
    const now = Date.now()
    if (this.lastHealthCheck && (now - this.lastHealthCheck.timestamp) < this.HEALTH_CACHE_TTL) {
      return this.lastHealthCheck.available
    }

    if (!this.apiKey) {
      this.lastHealthCheck = { available: false, timestamp: now }
      return false
    }

    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT)
      const response = await fetch(this.baseUrl + '/models', {
        headers: this.getHeaders(),
        signal: controller.signal,
      })
      clearTimeout(timer)
      const available = response.ok
      this.lastHealthCheck = { available, timestamp: now }
      return available
    } catch {
      this.lastHealthCheck = { available: false, timestamp: now }
      return false
    }
  }

  async listModels(): Promise<AIModel[]> {
    if (!this.apiKey) throw new AIOfflineError('No OpenAI API key configured', 'openai', 'NO_API_KEY')

    const response = await fetch(this.baseUrl + '/models', {
      headers: this.getHeaders(),
      signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT),
    })
    if (!response.ok) throw new Error('OpenAI returned ' + response.status)

    const data = await response.json() as any
    const allModels = data.data || []

    // Filter to chat-capable models
    const chatModels = allModels.filter((m: any) => {
      const id = (m.id || '').toLowerCase()
      return CHAT_CAPABLE_PREFIXES.some(prefix => id.startsWith(prefix))
    })

    return chatModels.map((m: any) => ({
      id: m.id,
      name: m.id,
      size: 0,
      family: m.id.startsWith('gpt-4') ? 'gpt-4' : m.id.startsWith('gpt-3.5') ? 'gpt-3.5' : m.id.startsWith('o1') ? 'o1' : m.id.startsWith('o3') ? 'o3' : 'unknown',
      parameters: 'unknown',
      quantization: 'unknown',
      contextLength: 128000,
      capabilities: ['completion', 'chat'],
      provider: 'openai',
    }))
  }

  async chat(messages: AIMessage[], options?: ChatOptions): Promise<ChatResponse> {
    if (!this.apiKey) throw new AIOfflineError('No OpenAI API key configured', 'openai', 'NO_API_KEY')

    const model = options?.model || this.defaultModel
    const signal = options?.signal || AbortSignal.timeout(REQUEST_TIMEOUT)
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const body: Record<string, any> = {
          model,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: false,
        }
        if (options?.temperature !== undefined) body.temperature = options.temperature
        if (options?.maxTokens !== undefined) body.max_tokens = options.maxTokens

        const response = await fetch(this.baseUrl + '/chat/completions', {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(body),
          signal,
        })

        if (!response.ok) {
          const text = await response.text().catch(() => '')
          if (response.status === 401) {
            throw new AIOfflineError('OpenAI API key is invalid', 'openai', 'INVALID_API_KEY')
          }
          if (response.status === 429) {
            throw new AIOfflineError('OpenAI rate limit exceeded', 'openai', 'RATE_LIMITED')
          }
          throw new Error('OpenAI error ' + response.status + ': ' + text)
        }

        const data = await response.json() as any
        const content = data.choices?.[0]?.message?.content || ''
        const usage = data.usage || {}

        return {
          content,
          model: data.model || model,
          totalDuration: 0,
          evalCount: usage.completion_tokens || 0,
          evalDuration: 0,
          promptEvalCount: usage.prompt_tokens || 0,
        }
      } catch (err: any) {
        lastError = err
        if (err.name === 'AbortError' && options?.signal?.aborted) throw err
        if (err.code === 'ECONNREFUSED') {
          throw new AIOfflineError('Cannot reach OpenAI API', 'openai', 'OPENAI_OFFLINE')
        }
        if (err instanceof AIOfflineError) throw err
        if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
      }
    }

    if (lastError?.name === 'TimeoutError' || lastError?.message?.includes('timeout')) {
      throw new AITimeoutError('OpenAI request timed out', 'openai', REQUEST_TIMEOUT)
    }
    throw lastError || new Error('OpenAI request failed')
  }

  async *stream(messages: AIMessage[], options?: ChatOptions): AsyncGenerator<StreamChunk> {
    if (!this.apiKey) {
      yield { type: 'error', data: JSON.stringify({ message: 'No OpenAI API key configured', code: 'NO_API_KEY' }) }
      return
    }

    const model = options?.model || this.defaultModel
    try {
      const body: Record<string, any> = {
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: true,
      }
      if (options?.temperature !== undefined) body.temperature = options.temperature
      if (options?.maxTokens !== undefined) body.max_tokens = options.maxTokens

      const response = await fetch(this.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        signal: options?.signal,
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error('OpenAI error ' + response.status + ': ' + text)
      }

      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          if (!trimmed.startsWith('data: ')) continue

          const payload = trimmed.slice(6)
          if (payload === '[DONE]') {
            yield { type: 'done', data: 'complete', model }
            return
          }

          try {
            const parsed = JSON.parse(payload)
            const delta = parsed.choices?.[0]?.delta
            if (delta?.content) {
              yield { type: 'token', data: delta.content, model: parsed.model || model }
            }
            if (parsed.choices?.[0]?.finish_reason === 'stop') {
              yield { type: 'done', data: JSON.stringify({ model: parsed.model || model }), model: parsed.model || model }
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      // If we reach here without [DONE], emit done anyway
      yield { type: 'done', data: 'complete', model }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        yield { type: 'done', data: 'aborted' }
        return
      }
      if (err.code === 'ECONNREFUSED') {
        yield { type: 'error', data: JSON.stringify({ message: 'Cannot reach OpenAI API', code: 'OPENAI_OFFLINE' }) }
        return
      }
      yield { type: 'error', data: err.message || 'Stream failed' }
    }
  }

  async generate(prompt: string, systemPrompt?: string, options?: ChatOptions): Promise<string> {
    const messages: AIMessage[] = []
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
    messages.push({ role: 'user', content: prompt })
    return (await this.chat(messages, options)).content
  }

  async getStatus(): Promise<ProviderStatus> {
    const startTime = Date.now()
    try {
      const available = await this.isAvailable()
      const models = available ? await this.listModels() : []
      return {
        name: this.name,
        type: this.type,
        available,
        baseUrl: this.baseUrl,
        models,
        defaultModel: this.defaultModel,
        latencyMs: Date.now() - startTime,
        error: null,
        lastChecked: new Date(),
      }
    } catch (err: any) {
      return {
        name: this.name,
        type: this.type,
        available: false,
        baseUrl: this.baseUrl,
        models: [],
        defaultModel: this.defaultModel,
        latencyMs: null,
        error: err.message,
        lastChecked: new Date(),
      }
    }
  }

  setDefaultModel(model: string): void {
    this.defaultModel = model
  }

  getDefaultModel(): string {
    return this.defaultModel
  }
}
