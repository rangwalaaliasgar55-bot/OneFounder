import { ClaudeProvider } from './claude'
import { OllamaProvider } from './ollama'
import { MockAIProvider } from './mock'
import type { AIProvider } from './provider'

let aiProvider: AIProvider | null = null
let activeProviderName: string = 'mock'
// Re-check provider if it was cached as mock (Ollama may start later)
let lastProviderCheck = 0
const PROVIDER_CACHE_TTL = 60_000 // 1 min — re-check if mock is cached

export async function getAIProvider(): Promise<AIProvider> {
  const now = Date.now()
  // Return cached non-mock provider immediately
  if (aiProvider && activeProviderName !== 'mock') return aiProvider
  // Re-check if mock or cache is stale
  if (aiProvider && activeProviderName === 'mock' && now - lastProviderCheck < PROVIDER_CACHE_TTL) {
    return aiProvider
  }

  lastProviderCheck = now

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
    if (activeProviderName !== 'mock') {
      console.log('⚠️  No AI provider available, using demo mode.')
    }
    activeProviderName = 'mock'
    aiProvider = new MockAIProvider()
  }

  return aiProvider
}

export async function getAIStatus(): Promise<{ available: boolean; provider: string; models?: string[]; note?: string }> {
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
  return {
    available: false,
    provider: 'mock',
    note: 'Start Ollama locally (ollama serve) or add ANTHROPIC_API_KEY to enable real AI.',
  }
}

export { type AIProvider }
