import { OllamaProvider } from './ollama'
import { MockAIProvider } from './mock'
import { ClaudeProvider } from './claude'
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

  // 1. Try Ollama first — free, local, open-source
  const ollama = new OllamaProvider(
    process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    process.env.OLLAMA_MODEL || 'llama3.2'
  )
  const ollamaAvailable = await ollama.isAvailable()

  if (ollamaAvailable) {
    if (activeProviderName !== 'ollama') {
      console.log('🧠 OneFounder AI — engine online (Ollama)')
    }
    activeProviderName = 'ollama'
    aiProvider = ollama
    return aiProvider
  }

  // 2. Fall back to Claude via Replit AI integration (auto-provisioned, no key required from user)
  const claudeKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY
  if (claudeKey) {
    if (activeProviderName !== 'claude') {
      console.log('🧠 OneFounder AI — engine online (Claude via Replit)')
    }
    activeProviderName = 'claude'
    aiProvider = new ClaudeProvider(
      claudeKey,
      process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
      'claude-haiku-4-5'
    )
    return aiProvider
  }

  // 3. Demo mode — no AI available
  if (activeProviderName !== 'mock') {
    console.log('⚠️  OneFounder AI — demo mode (no Ollama or Claude). Run: ollama serve && ollama pull llama3.2')
  }
  activeProviderName = 'mock'
  aiProvider = new MockAIProvider()
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
  const ollamaAvailable = await ollama.isAvailable()

  if (ollamaAvailable) {
    const models = await ollama.listModels()
    return { available: true, provider: 'OneFounder AI (Ollama)', models }
  }

  const claudeKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY
  if (claudeKey) {
    return {
      available: true,
      provider: 'OneFounder AI (Claude)',
      models: ['claude-haiku-4-5'],
    }
  }

  return {
    available: false,
    provider: 'OneFounder AI (demo)',
    note: 'Start Ollama to enable AI: ollama serve && ollama pull llama3.2',
  }
}

export { type AIProvider }
