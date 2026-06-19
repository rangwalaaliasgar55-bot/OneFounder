/**
 * OneFounder AI Provider Registry
 * 
 * Manages multiple AI providers and provides a unified interface
 * for accessing them. Handles provider selection, health checks,
 * and failover logic.
 */

import type { AIProvider, ProviderType, ProviderStatus } from './types.js'

class ProviderRegistry {
  private providers: Map<string, AIProvider> = new Map()
  private statusCache: Map<string, { status: ProviderStatus; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 30_000 // 30 seconds

  /**
   * Register a new AI provider
   */
  register(provider: AIProvider): void {
    this.providers.set(provider.type, provider)
    console.log(`[AI Registry] Registered provider: ${provider.name} (${provider.type})`)
  }

  /**
   * Get a provider by type
   */
  get(type: ProviderType): AIProvider | undefined {
    return this.providers.get(type)
  }

  /**
   * Get the default provider (first available, or specified default)
   */
  getDefault(preferred?: ProviderType): AIProvider | undefined {
    // Try preferred provider first
    if (preferred) {
      const provider = this.providers.get(preferred)
      if (provider) return provider
    }

    // Fall back to first registered provider
    const first = this.providers.values().next().value
    return first
  }

  /**
   * Get all registered providers
   */
  getAll(): AIProvider[] {
    return Array.from(this.providers.values())
  }

  /**
   * Get status of all providers (with caching)
   */
  async getStatus(): Promise<ProviderStatus[]> {
    const now = Date.now()
    const statuses: ProviderStatus[] = []

    for (const [type, provider] of this.providers) {
      const cached = this.statusCache.get(type)
      
      // Use cache if fresh
      if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
        statuses.push(cached.status)
        continue
      }

      // Fetch fresh status
      try {
        const status = await provider.getStatus()
        this.statusCache.set(type, { status, timestamp: now })
        statuses.push(status)
      } catch (err: any) {
        const errorStatus: ProviderStatus = {
          name: provider.name,
          type: provider.type,
          available: false,
          baseUrl: provider.baseUrl,
          models: [],
          defaultModel: null,
          latencyMs: null,
          error: err.message,
          lastChecked: new Date(),
        }
        this.statusCache.set(type, { status: errorStatus, timestamp: now })
        statuses.push(errorStatus)
      }
    }

    return statuses
  }

  /**
   * Find the first available provider
   */
  async findAvailable(preferred?: ProviderType): Promise<AIProvider | null> {
    // Try preferred first
    if (preferred) {
      const provider = this.providers.get(preferred)
      if (provider) {
        try {
          const available = await provider.isAvailable()
          if (available) return provider
        } catch {}
      }
    }

    // Try all providers
    for (const provider of this.providers) {
      try {
        const available = await provider[1].isAvailable()
        if (available) return provider[1]
      } catch {}
    }

    return null
  }

  /**
   * Clear the status cache
   */
  clearCache(): void {
    this.statusCache.clear()
  }
}

// Singleton instance
export const registry = new ProviderRegistry()
