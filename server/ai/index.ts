import { ClaudeProvider } from './claude'
import { OllamaProvider } from './ollama'
import { MockAIProvider } from './mock'
import type { AIProvider } from './provider'

let aiProvider: AIProvider | null = null
let activeProviderName: string = 'mock'

export async function getAIProvider(): Promise<AIProvider> {
  if (aiProvider) return aiProvider

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (anthropicKey) {
    console.log('✅ Claude AI provider connected (claude-sonnet-4-20250514)')
    activeProviderName = 'claude'
    aiProvider = new ClaudeProvider(anthropicKey)
    return aiProvider
  }

  const ollama = new OllamaProvider(
    process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    process.env.OLLAMA_MODEL || 'llama3.2'
  )
  const available = await ollama.isAvailable()

  if (available) {
    console.log('✅ Ollama AI provider connected')
    activeProviderName = 'ollama'
    aiProvider = ollama
  } else {
    console.log('⚠️  No AI provider available, using demo mode.')
    activeProviderName = 'mock'
    aiProvider = new MockAIProvider()
  }

  return aiProvider
}

export async function getAIStatus(): Promise<{ available: boolean; provider: string; models?: string[] }> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (anthropicKey) {
    return { available: true, provider: 'claude', models: ['claude-sonnet-4-20250514'] }
  }

  const ollama = new OllamaProvider(
    process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    process.env.OLLAMA_MODEL || 'llama3.2'
  )
  const available = await ollama.isAvailable()
  if (available) {
    const models = await ollama.listModels()
    return { available: true, provider: 'ollama', models }
  }
  return { available: false, provider: 'mock' }
}

export { type AIProvider }
