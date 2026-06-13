export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIProvider {
  generate(prompt: string, systemPrompt?: string): Promise<string>
  chat(messages: AIMessage[]): Promise<string>
  summarize(text: string): Promise<string>
  analyze(text: string, instruction: string): Promise<string>
  research(topic: string): Promise<string>
}

export type AIProviderType = 'ollama'

export interface AIConfig {
  provider: AIProviderType
  model?: string
  baseUrl?: string
}

export interface ProviderStatus {
  id: AIProviderType
  name: string
  available: boolean
  active: boolean
  models?: string[]
  note?: string
  setupUrl?: string
}

export class OllamaOfflineError extends Error {
  code = 'OLLAMA_OFFLINE'
  constructor() {
    super('Ollama is not running. Install from https://ollama.ai then run: ollama serve && ollama pull qwen3:8b')
    this.name = 'OllamaOfflineError'
  }
}
