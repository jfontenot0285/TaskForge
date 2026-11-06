import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  fetchMe,
  login as loginRequest,
  logout as logoutRequest,
  primeCsrf,
  register as registerRequest,
} from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      try {
        await primeCsrf()
        const me = await fetchMe()
        if (!cancelled) {
          setUser(me)
        }
      } catch {
        if (!cancelled) {
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false)
        }
      }
    }

    restoreSession()
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      checkingSession,
      async login(username, password) {
        await primeCsrf()
        const me = await loginRequest(username, password)
        setUser(me)
        return me
      },
      async register(username, password) {
        await primeCsrf()
        const me = await registerRequest(username, password)
        setUser(me)
        return me
      },
      async logout() {
        try {
          await logoutRequest()
        } finally {
          setUser(null)
        }
      },
    }),
    [user, checkingSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
