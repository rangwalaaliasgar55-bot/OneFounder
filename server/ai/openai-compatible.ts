import type { AIProvider, AIMessage } from './provider'

export interface OpenAICompatibleConfig {
  name: string
  baseUrl: string
  apiKey: string
  model: string
  extraHeaders?: Record<string, string>
}

export class OpenAICompatibleProvider implements AIProvider {
  private config: OpenAICompatibleConfig

  constructor(config: OpenAICompatibleConfig) {
    this.config = config
  }

  private async callAPI(messages: AIMessage[]): Promise<string> {
    const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...this.config.extraHeaders,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        max_tokens: 4096,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(120_000),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`${this.config.name} API error ${res.status}: ${body}`)
    }

    const data = await res.json() as any
    return data.choices?.[0]?.message?.content || ''
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: AIMessage[] = []
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
    messages.push({ role: 'user', content: prompt })
    return this.callAPI(messages)
  }

  async chat(messages: AIMessage[]): Promise<string> {
    return this.callAPI(messages)
  }

  async summarize(text: string): Promise<string> {
    return this.generate(
      `Summarize the following text concisely:\n\n${text}`,
      'You are a helpful assistant that creates concise, accurate summaries.'
    )
  }

  async analyze(text: string, instruction: string): Promise<string> {
    return this.generate(
      `${instruction}\n\nText to analyze:\n${text}`,
      'You are an expert business analyst. Provide structured, actionable insights.'
    )
  }

  async research(topic: string): Promise<string> {
    return this.generate(
      `Research and provide comprehensive insights about: ${topic}`,
      'You are a business research expert. Provide data-driven insights, market analysis, and strategic recommendations.'
    )
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.apiKey) return false
    try {
      const res = await fetch(`${this.config.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
        signal: AbortSignal.timeout(5_000),
      })
      return res.ok
    } catch {
      return false
    }
  }
}

export function makeDeepSeek(): OpenAICompatibleProvider {
  return new OpenAICompatibleProvider({
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  })
}

export function makeGroq(): OpenAICompatibleProvider {
  return new OpenAICompatibleProvider({
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  })
}

// Together AI removed — free credits run out and charges begin. Not safe for "always free".

export function makeOpenRouter(): OpenAICompatibleProvider {
  // Only use :free tagged models — these are permanently free with rate limiting, never charged
  return new OpenAICompatibleProvider({
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat:free',
    extraHeaders: {
      'HTTP-Referer': 'https://onefoundr.app',
      'X-Title': 'OneFounder',
    },
  })
}
