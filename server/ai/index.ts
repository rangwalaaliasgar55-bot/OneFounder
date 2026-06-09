import { OllamaProvider } from './ollama'
import { MockAIProvider } from './mock'
import type { AIProvider } from './provider'

let aiProvider: AIProvider | null = null
let ollamaAvailable: boolean | null = null

export async function getAIProvider(): Promise<AIProvider> {
  if (aiProvider) return aiProvider

  const ollama = new OllamaProvider(
    process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    process.env.OLLAMA_MODEL || 'llama3.2'
  )

  const available = await ollama.isAvailable()
  ollamaAvailable = available

  if (available) {
    console.log('✅ Ollama AI provider connected')
    aiProvider = ollama
  } else {
    console.log('⚠️  Ollama not available, using demo mode. Install Ollama for real AI.')
    aiProvider = new MockAIProvider()
  }

  return aiProvider
}

export async function getAIStatus(): Promise<{ available: boolean; provider: string; models?: string[] }> {
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
