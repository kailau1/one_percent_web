import { jwtDecode } from 'jwt-decode'
import type { User } from '@/api/types'

interface TokenClaims {
  userId: string
  email: string
  firstName: string
  lastName: string
  /** Expiry, in seconds since 1970. */
  exp?: number
}

/**
 * Reads the user out of a login token, or returns null if the token is unreadable or expired.
 *
 * This is only for display and for not bothering the server with a token we already know is
 * dead. It is NOT a security check: the server verifies the signature on every request.
 */
export function userFromToken(token: string | null, now: number = Date.now()): User | null {
  if (!token) return null
  try {
    const claims = jwtDecode<TokenClaims>(token)
    if (!claims.userId || !claims.email) return null
    if (claims.exp !== undefined && claims.exp * 1000 <= now) return null
    return { id: claims.userId, email: claims.email, firstName: claims.firstName, lastName: claims.lastName }
  } catch {
    return null
  }
}
