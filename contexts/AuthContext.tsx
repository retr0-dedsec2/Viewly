'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/types/user'
import { getUser, setAuth, clearAuth, getToken } from '@/lib/auth-client'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Always verify session with server (cookies are httpOnly, survive reload)
    const storedToken = getToken()

    fetch('/api/auth/me', {
      credentials: 'include',
      headers: storedToken
        ? {
            Authorization: `Bearer ${storedToken}`,
          }
        : undefined,
    })
      .then((res) => {
        if (res.ok) return res.json()
        throw new Error('Invalid token')
      })
      .then((data) => {
        setUser(data.user)
        // Refresh local cache if we still have a token
        if (storedToken) {
          setAuth(storedToken, data.user)
        }
      })
      .catch(() => {
        clearAuth()
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const login = (token: string, userData: User) => {
    setAuth(token, userData)
    setUser(userData)
  }

  const logout = () => {
    clearAuth()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

