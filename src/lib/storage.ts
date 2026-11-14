/**
 * localStorage can throw (private browsing, blocked site data, full quota), so every read and
 * write goes through here and simply behaves as "nothing stored" when it isn't available.
 */
const PREFIX = 'onepercent.'

export const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(PREFIX + key)
    } catch {
      return null
    }
  },
  set(key: string, value: string): void {
    try {
      localStorage.setItem(PREFIX + key, value)
    } catch {
      /* not available: carry on without persisting */
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key)
    } catch {
      /* not available */
    }
  },
  getJson<T>(key: string): T | null {
    const raw = storage.get(key)
    if (!raw) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  },
  setJson(key: string, value: unknown): void {
    storage.set(key, JSON.stringify(value))
  },
}
