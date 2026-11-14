import { createContext, useContext } from 'react'
import type { User } from '@/api/types'
import type { Credentials, Registration } from './api'

export interface AuthContextValue {
  /** The logged-in user, or null. */
  user: User | null
  /** True after the server rejected the session, until the next successful login. */
  sessionExpired: boolean
  /** True after the user chose to log out, until the next login. */
  loggedOut: boolean
  login: (credentials: Credentials) => Promise<void>
  /** Creates the account, then logs straight in. */
  register: (registration: Registration) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}

/** The logged-in user, for pages that only render when someone is logged in. */
export function useUser(): User {
  const { user } = useAuth()
  if (!user) throw new Error('useUser must be used on a page behind RequireAuth')
  return user
}
