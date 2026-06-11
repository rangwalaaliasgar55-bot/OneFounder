import { OllamaProvider } from './ollama'
import { MockAIProvider } from './mock'
import type { AIProvider } from './provider'

let aiProvider: AIProvider | null = null
let activeProviderName: string = 'mock'
let lastProviderCheck = 0
const PROVIDER_CACHE_TTL = 60_000

export async function getAIProvider(): Promise<AIProvider> {
  const now = Date.now()
  if (aiProvider && activeProviderName !== 'mock') return aiProvider
  if (aiProvider && activeProviderName === 'mock' && now - lastProviderCheck < PROVIDER_CACHE_TTL) {
    return aiProvider
  }

  lastProviderCheck = now

  const ollama = new OllamaProvider(
    process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    process.env.OLLAMA_MODEL || 'llama3.2'
  )
  const available = await ollama.isAvailable()

  if (available) {
    if (activeProviderName !== 'ollama') console.log('✅ ONEFOUNDER AI — Ollama engine connected')
    activeProviderName = 'ollama'
    aiProvider = ollama
  } else {
    if (activeProviderName !== 'mock') console.log('⚠️  Ollama not available — running in demo mode. Start with: ollama serve')
    activeProviderName = 'mock'
    aiProvider = new MockAIProvider()
  }

  return aiProvider
}

export async function getAIStatus(): Promise<{ available: boolean; provider: string; models?: string[]; note?: string }> {
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
    note: 'Start Ollama to enable real AI: ollama serve && ollama pull llama3.2',
  }
}

export { type AIProvider }
