import type { AIProvider, AIModel, AIMessage, ChatOptions, ChatResponse, StreamChunk, ProviderStatus, ProviderType } from '../types.js'
import { AIOfflineError, AITimeoutError } from '../types.js'

const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'
const DEFAULT_MODEL = 'gemini-2.0-flash'
const REQUEST_TIMEOUT = 120000
const HEALTH_CHECK_TIMEOUT = 5000
const MAX_RETRIES = 2

export class GeminiProvider implements AIProvider {
  readonly name = 'Gemini'
  readonly type: ProviderType = 'gemini'
  readonly baseUrl: string
  private apiKey: string
  private defaultModel: string
  private lastHealthCheck: { available: boolean; timestamp: number } | null = null
  private readonly HEALTH_CACHE_TTL = 10000

  constructor(baseUrl?: string, model?: string, apiKey?: string) {
    this.baseUrl = baseUrl || process.env.GEMINI_BASE_URL || DEFAULT_BASE_URL
    this.defaultModel = model || process.env.GEMINI_MODEL || DEFAULT_MODEL
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || ''
  }

  private buildContents(messages: AIMessage[]): { systemInstruction?: { parts: { text: string }[] }; contents: { role: string; parts: { text: string }[] }[] } {
    let systemInstruction: { parts: { text: string }[] } | undefined
    const contents: { role: string; parts: { text: string }[] }[] = []

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = { parts: [{ text: msg.content }] }
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })
      }
    }

    return { systemInstruction, contents }
  }

  async isAvailable(): Promise<boolean> {
    const now = Date.now()
    if (this.lastHealthCheck && (now - this.lastHealthCheck.timestamp) < this.HEALTH_CACHE_TTL) {
      return this.lastHealthCheck.available
    }
    try {
      if (!this.apiKey) {
        this.lastHealthCheck = { available: false, timestamp: now }
        return false
      }
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT)
      const response = await fetch(this.baseUrl + '/models?key=' + this.apiKey, { signal: controller.signal })
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
    if (!this.apiKey) throw new AIOfflineError('Gemini API key not configured', 'gemini', 'GEMINI_NO_KEY')

    const response = await fetch(this.baseUrl + '/models?key=' + this.apiKey, {
      signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT),
    })
    if (!response.ok) throw new Error('Gemini returned ' + response.status)

    const data = await response.json() as any
    const models: AIModel[] = []

    for (const m of data.models || []) {
      const methods = m.supportedGenerationMethods || []
      if (!methods.includes('generateContent')) continue

      const nameParts = (m.name || '').split('/')
      const modelId = nameParts[nameParts.length - 1] || m.name

      models.push({
        id: modelId,
        name: m.displayName || modelId,
        size: 0,
        family: 'gemini',
        parameters: 'unknown',
        quantization: 'none',
        contextLength: m.inputTokenLimit || 32000,
        capabilities: methods.includes('streamGenerateContent') ? ['completion', 'chat', 'streaming'] : ['completion', 'chat'],
        provider: 'gemini',
      })
    }

    return models
  }

  async chat(messages: AIMessage[], options?: ChatOptions): Promise<ChatResponse> {
    if (!this.apiKey) throw new AIOfflineError('Gemini API key not configured', 'gemini', 'GEMINI_NO_KEY')

    const model = options?.model || this.defaultModel
    const signal = options?.signal || AbortSignal.timeout(REQUEST_TIMEOUT)
    const { systemInstruction, contents } = this.buildContents(messages)

    let lastError: Error | null = null
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const body: any = {
          contents,
          generationConfig: {
            temperature: options?.temperature ?? 0.7,
            maxOutputTokens: options?.maxTokens || 4096,
          },
        }
        if (systemInstruction) body.systemInstruction = systemInstruction

        const url = this.baseUrl + '/models/' + model + ':generateContent?key=' + this.apiKey
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal,
        })

        if (!response.ok) {
          const text = await response.text().catch(() => '')
          if (response.status === 400 || response.status === 403) throw new AIOfflineError('Gemini API error: ' + text, 'gemini', 'GEMINI_API_ERROR')
          throw new Error('Gemini error ' + response.status + ': ' + text)
        }

        const data = await response.json() as any
        const content = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || ''
        const usage = data.usageMetadata || {}

        return {
          content,
          model,
          totalDuration: 0,
          evalCount: usage.candidatesTokenCount || 0,
          evalDuration: 0,
          promptEvalCount: usage.promptTokenCount || 0,
        }
      } catch (err: any) {
        lastError = err
        if (err.name === 'AbortError' && options?.signal?.aborted) throw err
        if (err instanceof AIOfflineError) throw err
        if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
    if (lastError?.name === 'TimeoutError') throw new AITimeoutError('Gemini timeout', 'gemini', REQUEST_TIMEOUT)
    throw lastError || new Error('Gemini request failed')
  }

  async *stream(messages: AIMessage[], options?: ChatOptions): AsyncGenerator<StreamChunk> {
    if (!this.apiKey) {
      yield { type: 'error', data: JSON.stringify({ message: 'Gemini API key not configured', code: 'GEMINI_NO_KEY' }) }
      return
    }

    const model = options?.model || this.defaultModel
    const { systemInstruction, contents } = this.buildContents(messages)

    try {
      const body: any = {
        contents,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens || 4096,
        },
      }
      if (systemInstruction) body.systemInstruction = systemInstruction

      const url = this.baseUrl + '/models/' + model + ':streamGenerateContent?key=' + this.apiKey + '&alt=sse'
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: options?.signal,
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        yield { type: 'error', data: JSON.stringify({ message: 'Gemini error ' + response.status + ': ' + text, code: 'GEMINI_ERROR' }) }
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
          if (!dataStr) continue

          try {
            const parsed = JSON.parse(dataStr)
            const text = parsed.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || ''
            if (text) yield { type: 'token', data: text, model }

            if (parsed.candidates?.[0]?.finishReason) {
              yield { type: 'done', data: JSON.stringify({ model, finishReason: parsed.candidates[0].finishReason }), model }
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

  setDefaultModel(model: string): void { this.defaultModel = model }
  getDefaultModel(): string { return this.defaultModel }
}
