import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../lib/api'
import type { User } from '../types'

interface AuthValue {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<User>
  register: (data: { fullName: string; email: string; password: string; phone?: string }) => Promise<User>
  logout: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

function storedUser(): User | null {
  try { return JSON.parse(localStorage.getItem('mobin-silver-user') ?? 'null') as User | null } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(storedUser)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('mobin-silver-token')) return
    api.profile().then(nextUser => {
      localStorage.setItem('mobin-silver-user', JSON.stringify(nextUser)); setUser(nextUser)
    }).catch(() => {
      localStorage.removeItem('mobin-silver-token'); localStorage.removeItem('mobin-silver-user'); setUser(null)
    })
  }, [])

  const save = useCallback((nextUser: User, token: string) => {
    localStorage.setItem('mobin-silver-token', token)
    localStorage.setItem('mobin-silver-user', JSON.stringify(nextUser))
    setUser(nextUser)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true)
    try { const result = await api.login(username, password); save(result.user, result.token); return result.user }
    finally { setLoading(false) }
  }, [save])

  const register = useCallback(async (data: { fullName: string; email: string; password: string; phone?: string }) => {
    setLoading(true)
    try { const result = await api.register(data); save(result.user, result.token); return result.user }
    finally { setLoading(false) }
  }, [save])

  const logout = useCallback(() => {
    localStorage.removeItem('mobin-silver-token')
    localStorage.removeItem('mobin-silver-user')
    setUser(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    const nextUser = await api.profile()
    localStorage.setItem('mobin-silver-user', JSON.stringify(nextUser))
    setUser(nextUser)
  }, [])

  const value = useMemo(() => ({ user, loading, login, register, logout, refreshProfile }), [user, loading, login, register, logout, refreshProfile])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
