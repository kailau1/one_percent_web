import { storage } from '@/lib/storage'

/**
 * The login token, kept in one place so the API client can attach it to every request without
 * each feature passing it around. AuthProvider owns logging in and out; this only stores.
 *
 * Trade-off: localStorage is readable by any script on the page (XSS). Fine for an app that
 * runs locally; an httpOnly cookie is the hardened option if this is ever deployed publicly.
 */
const TOKEN_KEY = 'token'

type Listener = () => void
let onExpired: Listener | null = null

export const session = {
  getToken: (): string | null => storage.get(TOKEN_KEY),
  setToken: (token: string): void => storage.set(TOKEN_KEY, token),
  clear: (): void => storage.remove(TOKEN_KEY),

  /** AuthProvider registers what should happen when the server rejects the token. */
  onExpired(listener: Listener | null): void {
    onExpired = listener
  },
  /** Called by the API client on a 401 for a request that carried a token. */
  notifyExpired(): void {
    onExpired?.()
  },
}
