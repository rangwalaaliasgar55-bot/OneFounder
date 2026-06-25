/**
 * OneFounder AI Provider Index
 *
 * Uses the provider registry for unified provider management.
 * Supports multiple providers with automatic failover and priority-based fallback.
 *
 * Priority order: termux → ollama → openai → anthropic → gemini
 * Providers are only registered if their required env vars are present
 * (except Termux and Ollama which use local defaults).
 */

import { registry } from './registry.js'
import { TermuxAIProvider } from './providers/termux.js'
import { OllamaProvider } from './providers/ollama.js'
import { OpenAIProvider } from './providers/openai.js'
import { AnthropicProvider } from './providers/anthropic.js'
import { GeminiProvider } from './providers/gemini.js'
import { AIOfflineError } from './types.js'
import type { AIProvider, ProviderType, ProviderStatus } from './types.js'

// ─── Register providers (only if configured) ──────────────────────────────────

// Termux AI — local phone/device server, register with defaults (no env required)
const termux = new TermuxAIProvider()
registry.register(termux)

// Ollama — local LLM server, register with defaults (no env required)
const ollama = new OllamaProvider()
registry.register(ollama)

// OpenAI — requires API key
if (process.env.OPENAI_API_KEY) {
  const openai = new OpenAIProvider()
  registry.register(openai)
}

// Anthropic — requires API key
if (process.env.ANTHROPIC_API_KEY) {
  const anthropic = new AnthropicProvider()
  registry.register(anthropic)
}

// Gemini — requires API key (supports both GEMINI_API_KEY and GOOGLE_API_KEY)
if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
  const gemini = new GeminiProvider()
  registry.register(gemini)
}

// ─── Set priority-based fallback order ────────────────────────────────────────
registry.setPriorityOrder(['termux', 'ollama', 'openai', 'anthropic', 'gemini'])

/**
 * Get the default AI provider
 * Throws AIOfflineError if no provider is available
 */
export async function getAIProvider(preferred?: string): Promise<AIProvider> {
  const provider = await registry.findAvailable(preferred as ProviderType)
  if (!provider) {
    throw new AIOfflineError(
      'No AI provider available. Start Ollama (ollama serve), Termux AI, or set OPENAI_API_KEY / ANTHROPIC_API_KEY / GEMINI_API_KEY.',
      'none',
      'PROVIDER_OFFLINE'
    )
  }
  return provider
}

/**
 * Get status of all AI providers
 */
export async function getAIStatus(): Promise<{
  available: boolean
  provider: string
  activeProvider: string
  models: string[]
  note?: string
  providers: ProviderStatus[]
}> {
  const statuses = await registry.getStatus()
  const availableProvider = statuses.find(s => s.available)

  return {
    available: !!availableProvider,
    provider: availableProvider?.name || 'Offline',
    activeProvider: availableProvider?.type || 'offline',
    models: availableProvider?.models.map(m => m.id) || [],
    note: availableProvider
      ? undefined
      : 'No AI provider available. Start Ollama (ollama serve), Termux AI, or set OPENAI_API_KEY / ANTHROPIC_API_KEY / GEMINI_API_KEY.',
    providers: statuses,
  }
}

export { registry }
export type { AIProvider, ProviderType, ProviderStatus }
