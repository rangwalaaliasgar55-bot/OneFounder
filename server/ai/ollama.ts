import type { AIProvider, AIMessage } from './provider.js'

export class OllamaProvider implements AIProvider {
  private baseUrl: string
  private model: string

  constructor(baseUrl = 'http://localhost:11434', model = 'llama3.2') {
    this.baseUrl = baseUrl
    this.model = model
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: AIMessage[] = []
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
    messages.push({ role: 'user', content: prompt })
    return this.chat(messages)
  }

  async chat(messages: AIMessage[]): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
        }),
        signal: AbortSignal.timeout(120000),
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json() as any
      return data.message?.content || data.response || ''
    } catch (error: any) {
      if (error.name === 'TimeoutError' || error.code === 'ECONNREFUSED') {
        throw new Error('AI service unavailable. Please ensure Ollama is running with: ollama serve')
      }
      throw error
    }
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

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      })
      if (!response.ok) return []
      const data = await response.json() as any
      return data.models?.map((m: any) => m.name) || []
    } catch {
      return []
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      })
      return response.ok
    } catch {
      return false
    }
  }
}
