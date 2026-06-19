/**
 * OneFounder AI Provider Index
 *
 * Uses the provider registry for unified provider management.
 * Supports multiple providers with automatic failover.
 */

import { registry } from './registry.js'
import { OllamaProvider } from './providers/ollama.js'
import { AIOfflineError } from './types.js'
import type { AIProvider, ProviderStatus } from './types.js'

// Initialize providers
const ollama = new OllamaProvider()
registry.register(ollama)

/**
 * Get the default AI provider
 * Throws AIOfflineError if no provider is available
 */
export async function getAIProvider(preferred?: string): Promise<AIProvider> {
  const provider = await registry.findAvailable(preferred as any)
  if (!provider) {
    throw new AIOfflineError(
      'No AI provider available. Install Ollama from https://ollama.ai then run: ollama serve',
      'ollama',
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
      : 'Ollama is not running. Install from https://ollama.ai then run: ollama serve',
    providers: statuses,
  }
}

export { registry }
export type { AIProvider, ProviderStatus }
