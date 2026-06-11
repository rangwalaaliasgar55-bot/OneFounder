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

  // OneFounder AI runs on Ollama — a free, local, open-source LLM engine.
  // The AI identity, knowledge, and behaviour are defined by our master prompt.
  const ollama = new OllamaProvider(
    process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    process.env.OLLAMA_MODEL || 'llama3.2'
  )
  const available = await ollama.isAvailable()

  if (available) {
    if (activeProviderName !== 'ollama') {
      console.log('🧠 OneFounder AI — engine online (Ollama)')
    }
    activeProviderName = 'ollama'
    aiProvider = ollama
  } else {
    if (activeProviderName !== 'mock') {
      console.log('⚠️  OneFounder AI — running in demo mode (no Ollama). Start with: ollama serve && ollama pull llama3.2')
    }
    activeProviderName = 'mock'
    aiProvider = new MockAIProvider()
  }

  return aiProvider
}

export async function getAIStatus(): Promise<{
  available: boolean
  provider: string
  models?: string[]
  note?: string
}> {
  const ollama = new OllamaProvider(
    process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    process.env.OLLAMA_MODEL || 'llama3.2'
  )
  const available = await ollama.isAvailable()
  if (available) {
    const models = await ollama.listModels()
    return {
      available: true,
      provider: 'OneFounder AI',
      models,
    }
  }
  return {
    available: false,
    provider: 'OneFounder AI (demo)',
    note: 'Start Ollama to enable full AI: ollama serve && ollama pull llama3.2',
  }
}

export { type AIProvider }
