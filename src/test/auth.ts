import { session } from '@/api/session'
import type { User } from '@/api/types'

export const testUser: User = { id: 'u1', email: 'kai@example.com', firstName: 'Kai', lastName: 'Lau' }

/** Builds an unsigned JWT with the backend's claim names (the app only reads the payload). */
export function makeToken(overrides: Record<string, unknown> = {}): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const claims = {
    sub: testUser.email,
    userId: testUser.id,
    email: testUser.email,
    firstName: testUser.firstName,
    lastName: testUser.lastName,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    ...overrides,
  }
  return `${encode({ alg: 'HS256' })}.${encode(claims)}.signature`
}

/** Puts a valid session in storage, as if the user had logged in earlier. Call before rendering. */
export function signIn(overrides: Record<string, unknown> = {}): string {
  const token = makeToken(overrides)
  session.setToken(token)
  return token
}
