import type { AIProvider, AIModel, AIMessage, ChatOptions, ChatResponse, StreamChunk, ProviderStatus, ProviderType } from '../types.js'
import { AIOfflineError, AITimeoutError } from '../types.js'

const DEFAULT_BASE_URL = 'http://localhost:11434'
const DEFAULT_MODEL = 'qwen2.5-coder:3b'
const REQUEST_TIMEOUT = 120000
const HEALTH_CHECK_TIMEOUT = 5000
const MAX_RETRIES = 2

export class OllamaProvider implements AIProvider {
  readonly name = 'Ollama'
  readonly type: ProviderType = 'ollama'
  readonly baseUrl: string
  private defaultModel: string
  private lastHealthCheck: { available: boolean; timestamp: number } | null = null
  private readonly HEALTH_CACHE_TTL = 10000

  constructor(baseUrl?: string, model?: string) {
    this.baseUrl = baseUrl || process.env.OLLAMA_BASE_URL || DEFAULT_BASE_URL
    this.defaultModel = model || process.env.OLLAMA_MODEL || DEFAULT_MODEL
  }

  async isAvailable(): Promise<boolean> {
    const now = Date.now()
    if (this.lastHealthCheck && (now - this.lastHealthCheck.timestamp) < this.HEALTH_CACHE_TTL) {
      return this.lastHealthCheck.available
    }
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT)
      const response = await fetch(this.baseUrl + '/api/tags', { signal: controller.signal })
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
    const response = await fetch(this.baseUrl + '/api/tags', { signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT) })
    if (!response.ok) throw new Error('Ollama returned ' + response.status)
    const data = await response.json() as any
    return (data.models || []).map((m: any) => ({
      id: m.name, name: m.name, size: m.size || 0,
      family: m.details?.family || 'unknown', parameters: m.details?.parameter_size || 'unknown',
      quantization: m.details?.quantization_level || 'unknown', contextLength: m.details?.context_length || 4096,
      capabilities: m.capabilities || ['completion'], provider: 'ollama',
    }))
  }

  async chat(messages: AIMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const model = options?.model || this.defaultModel
    const signal = options?.signal || AbortSignal.timeout(REQUEST_TIMEOUT)
    let lastError: Error | null = null
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(this.baseUrl + '/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages: messages.map(m => ({ role: m.role, content: m.content })), stream: false, options: { temperature: options?.temperature, num_predict: options?.maxTokens } }),
          signal,
        })
        if (!response.ok) { const t = await response.text().catch(() => ''); throw new Error('Ollama error ' + response.status + ': ' + t) }
        const data = await response.json() as any
        return { content: data.message?.content || '', model: data.model || model, totalDuration: data.total_duration || 0, evalCount: data.eval_count || 0, evalDuration: data.eval_duration || 0, promptEvalCount: data.prompt_eval_count || 0 }
      } catch (err: any) {
        lastError = err
        if (err.name === 'AbortError' && options?.signal?.aborted) throw err
        if (err.code === 'ECONNREFUSED') throw new AIOfflineError('Ollama is not running', 'ollama', 'OLLAMA_OFFLINE')
        if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
    if (lastError?.name === 'TimeoutError') throw new AITimeoutError('Ollama timeout', 'ollama', REQUEST_TIMEOUT)
    throw lastError || new Error('Ollama request failed')
  }

  async *stream(messages: AIMessage[], options?: ChatOptions): AsyncGenerator<StreamChunk> {
    const model = options?.model || this.defaultModel
    try {
      const response = await fetch(this.baseUrl + '/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: messages.map(m => ({ role: m.role, content: m.content })), stream: true, options: { temperature: options?.temperature, num_predict: options?.maxTokens } }),
        signal: options?.signal,
      })
      if (!response.ok) { const t = await response.text().catch(() => ''); throw new Error('Ollama error ' + response.status + ': ' + t) }
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
          if (!line.trim()) continue
          try {
            const parsed = JSON.parse(line)
            if (parsed.message?.content) yield { type: 'token', data: parsed.message.content, model: parsed.model }
            if (parsed.done) yield { type: 'done', data: JSON.stringify({ model: parsed.model, totalDuration: parsed.total_duration, evalCount: parsed.eval_count, evalDuration: parsed.eval_duration }), model: parsed.model }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') { yield { type: 'done', data: 'aborted' }; return }
      if (err.code === 'ECONNREFUSED') { yield { type: 'error', data: JSON.stringify({ message: 'Ollama is not running', code: 'OLLAMA_OFFLINE' }) }; return }
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
      return { name: this.name, type: this.type, available, baseUrl: this.baseUrl, models, defaultModel: this.defaultModel, latencyMs: Date.now() - startTime, error: null, lastChecked: new Date() }
    } catch (err: any) {
      return { name: this.name, type: this.type, available: false, baseUrl: this.baseUrl, models: [], defaultModel: this.defaultModel, latencyMs: null, error: err.message, lastChecked: new Date() }
    }
  }

  setDefaultModel(model: string): void { this.defaultModel = model }
  getDefaultModel(): string { return this.defaultModel }
}
