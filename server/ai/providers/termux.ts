import type { AIProvider, AIModel, AIMessage, ChatOptions, ChatResponse, StreamChunk, ProviderStatus, ProviderType } from '../types.js'
import { AIOfflineError, AITimeoutError } from '../types.js'

const DEFAULT_BASE_URL = 'http://localhost:11435'
const REQUEST_TIMEOUT = 180000
const HEALTH_CHECK_TIMEOUT = 10000
const MAX_RETRIES = 2

export class TermuxAIProvider implements AIProvider {
  readonly name = 'Termux AI'
  readonly type: ProviderType = 'termux'
  readonly baseUrl: string
  private defaultModel: string
  private apiKey: string | undefined
  private lastHealthCheck: { available: boolean; timestamp: number } | null = null
  private readonly HEALTH_CACHE_TTL = 10000

  constructor(baseUrl?: string, model?: string, apiKey?: string) {
    this.baseUrl = baseUrl || process.env.TERMUX_AI_URL || DEFAULT_BASE_URL
    this.apiKey = apiKey || process.env.TERMUX_AI_KEY || undefined
    this.defaultModel = model || 'local-model'
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.apiKey) {
      headers['Authorization'] = 'Bearer ' + this.apiKey
    }
    return headers
  }

  async isAvailable(): Promise<boolean> {
    const now = Date.now()
    if (this.lastHealthCheck && (now - this.lastHealthCheck.timestamp) < this.HEALTH_CACHE_TTL) {
      return this.lastHealthCheck.available
    }
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT)

      // Try /v1/models first, fall back to /health
      let response: Response
      try {
        response = await fetch(this.baseUrl + '/v1/models', {
          headers: this.getHeaders(),
          signal: controller.signal,
        })
      } catch {
        response = await fetch(this.baseUrl + '/health', {
          signal: controller.signal,
        })
      }

      clearTimeout(timer)
      const available = response.ok
      this.lastHealthCheck = { available, timestamp: now }

      // If available and no model set yet, try to pick the first available model
      if (available && this.defaultModel === 'local-model') {
        try {
          const models = await this.listModels()
          if (models.length > 0) {
            this.defaultModel = models[0].id
          }
        } catch {
          // Keep 'local-model' if we can't list models
        }
      }

      return available
    } catch {
      this.lastHealthCheck = { available: false, timestamp: now }
      return false
    }
  }

  async listModels(): Promise<AIModel[]> {
    const response = await fetch(this.baseUrl + '/v1/models', {
      headers: this.getHeaders(),
      signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT),
    })
    if (!response.ok) throw new Error('Termux AI returned ' + response.status)
    const data = await response.json() as any
    const models = data.data || data.models || []
    return models.map((m: any) => ({
      id: m.id || m.name,
      name: m.id || m.name,
      size: m.size || 0,
      family: 'unknown',
      parameters: 'unknown',
      quantization: 'unknown',
      contextLength: 4096,
      capabilities: ['completion'],
      provider: 'termux',
    }))
  }

  async chat(messages: AIMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const model = options?.model || this.defaultModel
    const signal = options?.signal || AbortSignal.timeout(REQUEST_TIMEOUT)
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(this.baseUrl + '/v1/chat/completions', {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            model,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            stream: false,
            temperature: options?.temperature,
            max_tokens: options?.maxTokens,
          }),
          signal,
        })

        if (!response.ok) {
          const text = await response.text().catch(() => '')
          if (response.status === 429) {
            throw new AIOfflineError('Termux AI rate limited', 'termux', 'RATE_LIMITED')
          }
          throw new Error('Termux AI error ' + response.status + ': ' + text)
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
          throw new AIOfflineError('Termux AI server is not running', 'termux', 'TERMUX_OFFLINE')
        }
        if (err instanceof AIOfflineError) throw err
        if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
      }
    }

    if (lastError?.name === 'TimeoutError' || lastError?.message?.includes('timeout')) {
      throw new AITimeoutError('Termux AI request timed out', 'termux', REQUEST_TIMEOUT)
    }
    throw lastError || new Error('Termux AI request failed')
  }

  async *stream(messages: AIMessage[], options?: ChatOptions): AsyncGenerator<StreamChunk> {
    const model = options?.model || this.defaultModel
    try {
      const response = await fetch(this.baseUrl + '/v1/chat/completions', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: true,
          temperature: options?.temperature,
          max_tokens: options?.maxTokens,
        }),
        signal: options?.signal,
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error('Termux AI error ' + response.status + ': ' + text)
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
        yield { type: 'error', data: JSON.stringify({ message: 'Termux AI server is not running', code: 'TERMUX_OFFLINE' }) }
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
