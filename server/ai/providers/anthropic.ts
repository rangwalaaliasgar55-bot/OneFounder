import type { AIProvider, AIModel, AIMessage, ChatOptions, ChatResponse, StreamChunk, ProviderStatus, ProviderType } from '../types.js'
import { AIOfflineError, AITimeoutError } from '../types.js'

const DEFAULT_BASE_URL = 'https://api.anthropic.com'
const DEFAULT_MODEL = 'claude-sonnet-4-20250514'
const REQUEST_TIMEOUT = 120000
const HEALTH_CHECK_TIMEOUT = 5000
const MAX_RETRIES = 2
const API_VERSION = '2023-06-01'

const KNOWN_MODELS: AIModel[] = [
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4 (Latest)',
    size: 0,
    family: 'claude',
    parameters: 'unknown',
    quantization: 'none',
    contextLength: 200000,
    capabilities: ['completion', 'chat', 'tools'],
    provider: 'anthropic',
  },
  {
    id: 'claude-haiku-4-20250414',
    name: 'Claude Haiku 4 (Fastest)',
    size: 0,
    family: 'claude',
    parameters: 'unknown',
    quantization: 'none',
    contextLength: 200000,
    capabilities: ['completion', 'chat', 'tools'],
    provider: 'anthropic',
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    size: 0,
    family: 'claude',
    parameters: 'unknown',
    quantization: 'none',
    contextLength: 200000,
    capabilities: ['completion', 'chat', 'tools'],
    provider: 'anthropic',
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    size: 0,
    family: 'claude',
    parameters: 'unknown',
    quantization: 'none',
    contextLength: 200000,
    capabilities: ['completion', 'chat', 'tools'],
    provider: 'anthropic',
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    size: 0,
    family: 'claude',
    parameters: 'unknown',
    quantization: 'none',
    contextLength: 200000,
    capabilities: ['completion', 'chat', 'tools'],
    provider: 'anthropic',
  },
]

export class AnthropicProvider implements AIProvider {
  readonly name = 'Anthropic'
  readonly type: ProviderType = 'anthropic'
  readonly baseUrl: string
  private apiKey: string
  private defaultModel: string
  private lastHealthCheck: { available: boolean; timestamp: number } | null = null
  private readonly HEALTH_CACHE_TTL = 10000

  constructor(baseUrl?: string, model?: string, apiKey?: string) {
    this.baseUrl = baseUrl || process.env.ANTHROPIC_BASE_URL || DEFAULT_BASE_URL
    this.defaultModel = model || process.env.ANTHROPIC_MODEL || DEFAULT_MODEL
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || ''
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': API_VERSION,
    }
  }

  private buildMessages(messages: AIMessage[]): { system?: string; messages: { role: 'user' | 'assistant'; content: string }[] } {
    let system: string | undefined
    const apiMessages: { role: 'user' | 'assistant'; content: string }[] = []

    for (const msg of messages) {
      if (msg.role === 'system') {
        system = msg.content
      } else {
        apiMessages.push({ role: msg.role, content: msg.content })
      }
    }

    return { system, messages: apiMessages }
  }

  async isAvailable(): Promise<boolean> {
    const now = Date.now()
    if (this.lastHealthCheck && (now - this.lastHealthCheck.timestamp) < this.HEALTH_CACHE_TTL) {
      return this.lastHealthCheck.available
    }
    const available = !!this.apiKey
    this.lastHealthCheck = { available, timestamp: now }
    return available
  }

  async listModels(): Promise<AIModel[]> {
    return KNOWN_MODELS
  }

  async chat(messages: AIMessage[], options?: ChatOptions): Promise<ChatResponse> {
    if (!this.apiKey) throw new AIOfflineError('Anthropic API key not configured', 'anthropic', 'ANTHROPIC_NO_KEY')

    const model = options?.model || this.defaultModel
    const signal = options?.signal || AbortSignal.timeout(REQUEST_TIMEOUT)
    const { system, messages: apiMessages } = this.buildMessages(messages)

    let lastError: Error | null = null
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const body: any = {
          model,
          max_tokens: options?.maxTokens || 4096,
          messages: apiMessages,
        }
        if (system) body.system = system
        if (options?.temperature !== undefined) body.temperature = options.temperature

        const response = await fetch(this.baseUrl + '/v1/messages', {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(body),
          signal,
        })

        if (!response.ok) {
          const text = await response.text().catch(() => '')
          if (response.status === 401) throw new AIOfflineError('Anthropic API key is invalid', 'anthropic', 'ANTHROPIC_INVALID_KEY')
          if (response.status === 429) throw new AIOfflineError('Anthropic rate limit exceeded', 'anthropic', 'ANTHROPIC_RATE_LIMIT')
          throw new Error('Anthropic error ' + response.status + ': ' + text)
        }

        const data = await response.json() as any
        const content = data.content?.map((c: any) => c.text || '').join('') || ''
        const usage = data.usage || {}

        return {
          content,
          model: data.model || model,
          totalDuration: 0,
          evalCount: usage.output_tokens || 0,
          evalDuration: 0,
          promptEvalCount: usage.input_tokens || 0,
        }
      } catch (err: any) {
        lastError = err
        if (err.name === 'AbortError' && options?.signal?.aborted) throw err
        if (err instanceof AIOfflineError) throw err
        if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
    if (lastError?.name === 'TimeoutError') throw new AITimeoutError('Anthropic timeout', 'anthropic', REQUEST_TIMEOUT)
    throw lastError || new Error('Anthropic request failed')
  }

  async *stream(messages: AIMessage[], options?: ChatOptions): AsyncGenerator<StreamChunk> {
    if (!this.apiKey) {
      yield { type: 'error', data: JSON.stringify({ message: 'Anthropic API key not configured', code: 'ANTHROPIC_NO_KEY' }) }
      return
    }

    const model = options?.model || this.defaultModel
    const { system, messages: apiMessages } = this.buildMessages(messages)

    try {
      const body: any = {
        model,
        max_tokens: options?.maxTokens || 4096,
        messages: apiMessages,
        stream: true,
      }
      if (system) body.system = system
      if (options?.temperature !== undefined) body.temperature = options.temperature

      const response = await fetch(this.baseUrl + '/v1/messages', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        signal: options?.signal,
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        yield { type: 'error', data: JSON.stringify({ message: 'Anthropic error ' + response.status + ': ' + text, code: 'ANTHROPIC_ERROR' }) }
        return
      }

      if (!response.body) {
        yield { type: 'error', data: 'No response body' }
        return
      }

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
          if (!line.startsWith('data: ')) continue
          const dataStr = line.slice(6).trim()
          if (!dataStr || dataStr === '[DONE]') continue

          try {
            const parsed = JSON.parse(dataStr)
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              yield { type: 'token', data: parsed.delta.text, model }
            }
            if (parsed.type === 'message_stop') {
              yield { type: 'done', data: JSON.stringify({ model }), model }
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        yield { type: 'done', data: 'aborted' }
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
      const models = await this.listModels()
      return {
        name: this.name,
        type: this.type,
        available,
        baseUrl: this.baseUrl,
        models,
        defaultModel: this.defaultModel,
        latencyMs: Date.now() - startTime,
        error: available ? null : 'API key not configured',
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

  setDefaultModel(model: string): void { this.defaultModel = model }
  getDefaultModel(): string { return this.defaultModel }
}
