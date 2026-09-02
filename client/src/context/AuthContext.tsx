import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { UserProfile } from '../types'
import { api, clearToken, getToken, setToken } from '../api/client'

interface AuthContextType {
  ready: boolean
  isAuthenticated: boolean
  login: (password: string) => Promise<boolean>
  logout: () => void
  profile: UserProfile
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
}

const fallbackProfile: UserProfile = {
  name: 'Vinay',
  mobile: '9900000000',
  email: 'vinay@veew.in',
  companyName: 'Vinayaka Electricals and Engineering Works',
  companyLocation: 'Chitradurga',
  notificationPreferences: {
    missingDocuments: true,
    pendingPayments: true,
    followUps: true,
    stageReminders: true,
    agencyInspection: true,
  },
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [profile, setProfile] = useState<UserProfile>(fallbackProfile)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setReady(true)
      return
    }
    api
      .get<{ profile: UserProfile }>('/auth/me')
      .then((data) => {
        setProfile(data.profile)
        setIsAuthenticated(true)
      })
      .catch(() => {
        clearToken()
        setIsAuthenticated(false)
      })
      .finally(() => setReady(true))
  }, [])

  const login = useCallback(async (password: string) => {
    try {
      const data = await api.post<{ token: string; profile: UserProfile }>('/auth/login', { password })
      setToken(data.token)
      setProfile(data.profile)
      setIsAuthenticated(true)
      return true
    } catch {
      return false
    }
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setIsAuthenticated(false)
  }, [])

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const data = await api.put<{ profile: UserProfile }>('/auth/profile', updates)
    setProfile(data.profile)
  }, [])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await api.put('/auth/password', { currentPassword, newPassword })
  }, [])

  return (
    <AuthContext.Provider value={{ ready, isAuthenticated, login, logout, profile, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
