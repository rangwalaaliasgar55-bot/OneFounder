import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'

/* ─── Types ─────────────────────────────────────────────────────── */
export interface ProviderModel {
  id: string
  name: string
}

export interface ProviderInfo {
  name: string
  type: string
  available: boolean
  baseUrl: string
  models: ProviderModel[]
  defaultModel: string | null
  latencyMs: number | null
  error: string | null
  enabled: boolean
  apiKey?: string
  endpoint?: string
}

export interface ProvidersStatus {
  providers: ProviderInfo[]
  fallbackOrder: string[]
  autoFailover: boolean
}

/* ─── Singleton polling (mirrors useOllamaStatus pattern) ──────── */
let globalStatus: ProvidersStatus | null = null
let globalListeners: Set<(s: ProvidersStatus | null) => void> = new Set()
let pollTimer: ReturnType<typeof setInterval> | null = null

function startPolling() {
  if (pollTimer) return
  const check = async () => {
    try {
      const data = await api.get<ProvidersStatus>('/providers')
      globalStatus = data
    } catch {
      globalStatus = { providers: [], fallbackOrder: [], autoFailover: true }
    }
    globalListeners.forEach(fn => fn(globalStatus))
  }
  check()
  pollTimer = setInterval(check, 30_000)
}

function stopPolling() {
  if (pollTimer && globalListeners.size === 0) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

/**
 * Shared multi-provider status hook — single polling instance across all
 * components. Fetches from GET /api/providers every 30s.
 */
export function useProviders() {
  const [status, setStatus] = useState<ProvidersStatus | null>(globalStatus)
  const listenerRef = useRef<((s: ProvidersStatus | null) => void) | undefined>(undefined)

  useEffect(() => {
    listenerRef.current = (s) => setStatus(s)
    globalListeners.add(listenerRef.current)
    startPolling()
    return () => {
      if (listenerRef.current) globalListeners.delete(listenerRef.current)
      stopPolling()
    }
  }, [])

  const refresh = async () => {
    try {
      const data = await api.get<ProvidersStatus>('/providers')
      globalStatus = data
      globalListeners.forEach(fn => fn(globalStatus))
    } catch { /* ignore — next poll will retry */ }
  }

  const providers = status?.providers ?? []
  const activeProvider = providers.find(p => p.available && p.enabled)
  const anyOnline = !!activeProvider

  return {
    providers,
    fallbackOrder: status?.fallbackOrder ?? [],
    autoFailover: status?.autoFailover ?? true,
    activeProvider,
    anyOnline,
    loading: status === null,
    refresh,
  }
}
