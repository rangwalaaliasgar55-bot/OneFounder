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

export type AIProviderType = 'ollama' | 'openai' | 'claude' | 'gemini'

export interface AIConfig {
  provider: AIProviderType
  model?: string
  baseUrl?: string
  apiKey?: string
}
