import { OllamaProvider } from './ollama'
import { MockAIProvider } from './mock'
import type { AIProvider, AIProviderType, ProviderStatus } from './provider'

let aiProvider: AIProvider | null = null
let activeProviderName: AIProviderType = 'mock'
let lastProviderCheck = 0
const PROVIDER_CACHE_TTL = 60_000

export async function getAIProvider(): Promise<AIProvider> {
  const now = Date.now()
  if (aiProvider && activeProviderName !== 'mock') return aiProvider
  if (aiProvider && activeProviderName === 'mock' && now - lastProviderCheck < PROVIDER_CACHE_TTL) {
    return aiProvider
  }

  lastProviderCheck = now

  // Ollama — local, fully free, no API key, no cloud, no costs
  const ollama = new OllamaProvider(
    process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    process.env.OLLAMA_MODEL || 'qwen3:8b'
  )
  if (await ollama.isAvailable()) {
    if (activeProviderName !== 'ollama') console.log('🧠 OneFounder AI — Ollama online (local inference)')
    activeProviderName = 'ollama'
    aiProvider = ollama
    return aiProvider
  }

  // Demo mode — no cloud fallback
  if (activeProviderName !== 'mock') {
    console.log('⚠️  OneFounder AI — demo mode. Install Ollama: https://ollama.ai  then run: ollama serve && ollama pull qwen3:8b')
  }
  activeProviderName = 'mock'
  aiProvider = new MockAIProvider()
  return aiProvider
}

export async function getAIStatus(): Promise<{
  available: boolean
  provider: string
  activeProvider: AIProviderType
  models?: string[]
  note?: string
  providers: ProviderStatus[]
}> {
  const ollama = new OllamaProvider(
    process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    process.env.OLLAMA_MODEL || 'qwen3:8b'
  )
  const ollamaAvail = await ollama.isAvailable()
  const ollamaModels = ollamaAvail ? await ollama.listModels() : []

  const statuses: ProviderStatus[] = [
    {
      id: 'ollama',
      name: 'Ollama (Local)',
      available: ollamaAvail,
      active: activeProviderName === 'ollama',
      models: ollamaModels,
      note: 'Free forever. Runs models on your machine. Zero AI costs. No API key needed.',
      setupUrl: 'https://ollama.ai',
    },
  ]

  return {
    available: ollamaAvail,
    provider: ollamaAvail ? 'Ollama (Local)' : 'OneFounder AI (demo)',
    activeProvider: activeProviderName,
    models: ollamaModels,
    note: ollamaAvail
      ? undefined
      : 'Install Ollama to enable AI: https://ollama.ai — then run: ollama serve && ollama pull qwen3:8b',
    providers: statuses,
  }
}

export { type AIProvider }
