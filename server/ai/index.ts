import { OllamaProvider } from './ollama'
import { ClaudeProvider } from './claude'
import { MockAIProvider } from './mock'
import type { AIProvider } from './provider'

let aiProvider: AIProvider | null = null
let activeProviderName: string = 'mock'
let lastProviderCheck = 0
const PROVIDER_CACHE_TTL = 60_000

function getClaudeApiKey(): string | undefined {
  return (
    process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ||
    process.env.ANTHROPIC_API_KEY
  )
}

function getClaudeBaseURL(): string | undefined {
  return process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL || undefined
}

export async function getAIProvider(): Promise<AIProvider> {
  const now = Date.now()
  if (aiProvider && activeProviderName !== 'mock') return aiProvider
  if (aiProvider && activeProviderName === 'mock' && now - lastProviderCheck < PROVIDER_CACHE_TTL) {
    return aiProvider
  }

  lastProviderCheck = now

  // 1️⃣ Try Ollama — free, local, open-source (preferred in dev)
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

  // 2️⃣ Try Claude (Anthropic) — used in production / Vercel
  const claudeKey = getClaudeApiKey()
  if (claudeKey) {
    if (activeProviderName !== 'claude') {
      console.log('🧠 OneFounder AI — engine online (Claude)')
    }
    activeProviderName = 'claude'
    aiProvider = new ClaudeProvider(claudeKey, getClaudeBaseURL())
    return aiProvider
  }

  // 3️⃣ Demo mode — no AI configured
  if (activeProviderName !== 'mock') {
    console.log('⚠️  OneFounder AI — demo mode (no Ollama or Claude API key found)')
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
  // Check Ollama first
  const ollama = new OllamaProvider(
    process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    process.env.OLLAMA_MODEL || 'llama3.2'
  )
  const ollamaAvailable = await ollama.isAvailable()
  if (ollamaAvailable) {
    const models = await ollama.listModels()
    return { available: true, provider: 'OneFounder AI (Ollama)', models }
  }

  // Check Claude
  const claudeKey = getClaudeApiKey()
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
    note: 'Add ANTHROPIC_API_KEY to Vercel env vars, or run Ollama locally: ollama serve && ollama pull llama3.2',
  }
}

export { type AIProvider }
