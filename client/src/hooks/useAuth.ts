import { useState, useEffect, useCallback } from 'react'
import { authApi } from '../lib/api'

export interface User {
  id: string
  name?: string
  email: string
  image?: string
  avatar?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const session = await authApi.getSession()
      setUser(session?.user || null)
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
