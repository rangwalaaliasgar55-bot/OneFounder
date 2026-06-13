import { useState, useEffect, useCallback } from 'react'
import { authApi } from '../lib/api'

export interface User {
  id: string
  name?: string
  email: string
  image?: string
  avatar?: string
  isAdmin?: boolean
  tokenBalance?: number
  tokenUsed?: number
  onboardingCompleted?: boolean
  ollamaConfigured?: boolean
  selectedModel?: string
  modelVerifiedAt?: string | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const session = await authApi.getSession()
      if (!session?.user) { setUser(null); return }

      // Fetch extended profile (onboardingCompleted etc.) from /api/me
      try {
        const me = await fetch('/api/me', { credentials: 'include' }).then(r => r.ok ? r.json() : null)
        setUser({ ...session.user, ...(me ?? {}) })
      } catch {
        setUser(session.user)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const signOut = async () => {
    await authApi.signOut()
    setUser(null)
    window.location.href = '/login'
  }

  return { user, loading, refresh, signOut }
}
