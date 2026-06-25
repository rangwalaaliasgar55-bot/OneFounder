import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'

export interface OllamaStatus {
  running: boolean
  models: string[]
  totalRamGb: number
  freeRamGb: number
  ramWarning: string | null
  version?: string
}

// Shared singleton state to avoid duplicate polling across components
let globalStatus: OllamaStatus | null = null
let globalListeners: Set<(s: OllamaStatus | null) => void> = new Set()
let pollTimer: ReturnType<typeof setInterval> | null = null

function startPolling() {
  if (pollTimer) return
  const check = async () => {
    try {
      const h = await api.get<OllamaStatus>('/ollama/health')
      globalStatus = h
    } catch {
      globalStatus = { running: false, models: [], totalRamGb: 0, freeRamGb: 0, ramWarning: null }
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
 * Shared Ollama status hook — single polling instance across all components.
 * Replaces duplicate polling in App.tsx and DashboardPage.
 */
export function useOllamaStatus() {
  const [status, setStatus] = useState<OllamaStatus | null>(globalStatus)
  const listenerRef = useRef<((s: OllamaStatus | null) => void) | undefined>(undefined)

  useEffect(() => {
    listenerRef.current = (s) => setStatus(s)
    globalListeners.add(listenerRef.current)
    startPolling()
    return () => {
      if (listenerRef.current) globalListeners.delete(listenerRef.current)
      stopPolling()
    }
  }, [])

  const online = status?.running && (status?.models?.length ?? 0) > 0

  return { status, online, loading: status === null }
}
