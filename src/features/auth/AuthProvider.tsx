import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { session } from '@/api/session'
import type { User } from '@/api/types'
import * as authApi from './api'
import type { Credentials, Registration } from './api'
import { userFromToken } from './token'
import { AuthContext } from './useAuth'

/** If the stored token is unreadable or expired, drop it and note that the session ended. */
function restoreSession(): { user: User | null; expired: boolean } {
  const token = session.getToken()
  const user = userFromToken(token)
  if (token && !user) {
    session.clear()
    return { user: null, expired: true }
  }
  return { user, expired: false }
}

/**
 * Owns "who is logged in". Pages read it with useAuth(); RequireAuth uses it to guard routes.
 * Logging out (by choice or because the server rejected the token) also throws away every
 * cached response, so one person's data can never appear for the next person to log in.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [restored] = useState(restoreSession)
  const [user, setUser] = useState<User | null>(restored.user)
  const [sessionExpired, setSessionExpired] = useState(restored.expired)
  const [loggedOut, setLoggedOut] = useState(false)

  const endSession = useCallback(
    (expired: boolean) => {
      session.clear()
      queryClient.clear()
      setUser(null)
      setSessionExpired(expired)
      setLoggedOut(!expired)
    },
    [queryClient],
  )

  // The API client calls this when any request comes back 401.
  useEffect(() => {
    session.onExpired(() => endSession(true))
    return () => session.onExpired(null)
  }, [endSession])

  const login = useCallback(
    async (credentials: Credentials) => {
      const token = await authApi.login(credentials)
      const loggedIn = userFromToken(token)
      if (!loggedIn) throw new Error('The server sent a login token the app could not read.')
      queryClient.clear()
      session.setToken(token)
      setUser(loggedIn)
      setSessionExpired(false)
      setLoggedOut(false)
    },
    [queryClient],
  )

  const register = useCallback(
    async (registration: Registration) => {
      await authApi.register(registration)
      // the register endpoint doesn't return a token, so log in with the same details
      await login({ email: registration.email, password: registration.password })
    },
    [login],
  )

  const logout = useCallback(() => endSession(false), [endSession])

  const value = useMemo(
    () => ({ user, sessionExpired, loggedOut, login, register, logout }),
    [user, sessionExpired, loggedOut, login, register, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
