import { OllamaProvider } from './ollama'
import { MockAIProvider } from './mock'
import { makeDeepSeek, makeGroq, makeTogether, makeOpenRouter } from './openai-compatible'
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

  // 1. Ollama — local, fully free, no API key required
  const ollama = new OllamaProvider(
    process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    process.env.OLLAMA_MODEL || 'llama3.2'
  )
  if (await ollama.isAvailable()) {
    if (activeProviderName !== 'ollama') console.log('🧠 OneFounder AI — Ollama online')
    activeProviderName = 'ollama'
    aiProvider = ollama
    return aiProvider
  }

  // 2. DeepSeek — free API tier
  if (process.env.DEEPSEEK_API_KEY) {
    const ds = makeDeepSeek()
    if (await ds.isAvailable()) {
      if (activeProviderName !== 'deepseek') console.log('🧠 OneFounder AI — DeepSeek online')
      activeProviderName = 'deepseek'
      aiProvider = ds
      return aiProvider
    }
  }

  // 3. Groq — free tier, very fast
  if (process.env.GROQ_API_KEY) {
    const groq = makeGroq()
    if (await groq.isAvailable()) {
      if (activeProviderName !== 'groq') console.log('🧠 OneFounder AI — Groq online')
      activeProviderName = 'groq'
      aiProvider = groq
      return aiProvider
    }
  }

  // 4. Together AI — free credits on sign-up
  if (process.env.TOGETHER_API_KEY) {
    const together = makeTogether()
    if (await together.isAvailable()) {
      if (activeProviderName !== 'together') console.log('🧠 OneFounder AI — Together AI online')
      activeProviderName = 'together'
      aiProvider = together
      return aiProvider
    }
  }

  // 5. OpenRouter — free models available
  if (process.env.OPENROUTER_API_KEY) {
    const or = makeOpenRouter()
    if (await or.isAvailable()) {
      if (activeProviderName !== 'openrouter') console.log('🧠 OneFounder AI — OpenRouter online')
      activeProviderName = 'openrouter'
      aiProvider = or
      return aiProvider
    }
  }

  // 6. Demo mode
  if (activeProviderName !== 'mock') {
    console.log('⚠️  OneFounder AI — demo mode. Add an API key or run: ollama serve && ollama pull llama3.2')
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
  const statuses: ProviderStatus[] = []

  // Ollama
  const ollama = new OllamaProvider(
    process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    process.env.OLLAMA_MODEL || 'llama3.2'
  )
  const ollamaAvail = await ollama.isAvailable()
  const ollamaModels = ollamaAvail ? await ollama.listModels() : []
  statuses.push({
    id: 'ollama',
    name: 'Ollama (Local)',
    available: ollamaAvail,
    active: activeProviderName === 'ollama',
    models: ollamaModels,
    note: 'Free forever. Runs models on your machine. No API key needed.',
    freeSignupUrl: 'https://ollama.ai',
    envKey: 'OLLAMA_BASE_URL',
    envKeySet: true,
  })

  // DeepSeek
  const dsKeySet = !!process.env.DEEPSEEK_API_KEY
  let dsAvail = false
  if (dsKeySet) { dsAvail = await makeDeepSeek().isAvailable() }
  statuses.push({
    id: 'deepseek',
    name: 'DeepSeek',
    available: dsAvail,
    active: activeProviderName === 'deepseek',
    note: 'Free API tier. Best reasoning model. Set DEEPSEEK_API_KEY.',
    freeSignupUrl: 'https://platform.deepseek.com',
    envKey: 'DEEPSEEK_API_KEY',
    envKeySet: dsKeySet,
  })

  // Groq
  const groqKeySet = !!process.env.GROQ_API_KEY
  let groqAvail = false
  if (groqKeySet) { groqAvail = await makeGroq().isAvailable() }
  statuses.push({
    id: 'groq',
    name: 'Groq',
    available: groqAvail,
    active: activeProviderName === 'groq',
    note: 'Free tier. Fastest inference. Llama 3.3, DeepSeek-R1. Set GROQ_API_KEY.',
    freeSignupUrl: 'https://console.groq.com',
    envKey: 'GROQ_API_KEY',
    envKeySet: groqKeySet,
  })

  // Together AI
  const togetherKeySet = !!process.env.TOGETHER_API_KEY
  let togetherAvail = false
  if (togetherKeySet) { togetherAvail = await makeTogether().isAvailable() }
  statuses.push({
    id: 'together',
    name: 'Together AI',
    available: togetherAvail,
    active: activeProviderName === 'together',
    note: 'Free $25 credits on sign-up. 200+ open models. Set TOGETHER_API_KEY.',
    freeSignupUrl: 'https://api.together.ai',
    envKey: 'TOGETHER_API_KEY',
    envKeySet: togetherKeySet,
  })

  // OpenRouter
  const orKeySet = !!process.env.OPENROUTER_API_KEY
  let orAvail = false
  if (orKeySet) { orAvail = await makeOpenRouter().isAvailable() }
  statuses.push({
    id: 'openrouter',
    name: 'OpenRouter',
    available: orAvail,
    active: activeProviderName === 'openrouter',
    note: 'Free tier with DeepSeek, Llama & more. Set OPENROUTER_API_KEY.',
    freeSignupUrl: 'https://openrouter.ai',
    envKey: 'OPENROUTER_API_KEY',
    envKeySet: orKeySet,
  })

  const activeStatus = statuses.find(s => s.active && s.id !== 'mock')
  const anyAvailable = statuses.some(s => s.available)

  return {
    available: anyAvailable,
    provider: activeStatus ? activeStatus.name : 'OneFounder AI (demo)',
    activeProvider: activeProviderName,
    models: ollamaModels,
    note: anyAvailable ? undefined : 'Add an API key below or install Ollama to enable AI.',
    providers: statuses,
  }
}

export { type AIProvider }
