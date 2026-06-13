import { OllamaProvider } from './ollama.js'
import { OllamaOfflineError } from './provider.js'
import type { AIProvider, AIProviderType, ProviderStatus } from './provider.js'

let aiProvider: OllamaProvider | null = null
let lastCheck = 0
const CACHE_TTL = 30_000

export async function getAIProvider(): Promise<AIProvider> {
  const now = Date.now()
  if (aiProvider && now - lastCheck < CACHE_TTL) {
    if (await aiProvider.isAvailable()) return aiProvider
  }

  lastCheck = now
  const ollama = new OllamaProvider(
    process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    process.env.OLLAMA_MODEL || 'qwen3:8b'
  )

  if (await ollama.isAvailable()) {
    aiProvider = ollama
    return aiProvider
  }

  aiProvider = null
  throw new OllamaOfflineError()
}

export async function getAIStatus(): Promise<{
  available: boolean
  provider: string
  activeProvider: AIProviderType | 'offline'
  models?: string[]
  note?: string
  providers: ProviderStatus[]
}> {
  const ollama = new OllamaProvider(
    process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    process.env.OLLAMA_MODEL || 'qwen3:8b'
  )
  const available = await ollama.isAvailable()
  const models = available ? await ollama.listModels() : []

  return {
    available,
    provider: available ? 'Ollama (Local)' : 'Offline',
    activeProvider: available ? 'ollama' : 'offline',
    models,
    note: available
      ? undefined
      : 'Ollama is not running. Run: ollama serve && ollama pull qwen3:8b',
    providers: [
      {
        id: 'ollama',
        name: 'Ollama (Local)',
        available,
        active: available,
        models,
        note: 'Free forever. Runs models on your machine. Zero cloud costs.',
        setupUrl: 'https://ollama.ai',
      },
    ],
  }
}

export { type AIProvider }
