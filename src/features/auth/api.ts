import { ApiError, apiRequest } from '@/api/client'
import type { AuthResponse } from '@/api/types'

export interface Credentials {
  email: string
  password: string
}

export interface Registration extends Credentials {
  firstName: string
  lastName: string
}

/** Exchanges an email and password for a login token. */
export async function login(credentials: Credentials): Promise<string> {
  try {
    const { token } = await apiRequest<AuthResponse>('/api/users/login', {
      method: 'POST',
      body: credentials,
      auth: false,
    })
    return token
  } catch (error) {
    // On this endpoint a 401 means the details were wrong, not that a session expired.
    if (error instanceof ApiError && error.kind === 'unauthorized') {
      throw new ApiError('unauthorized', 'That email and password don’t match an account.', error.status)
    }
    throw error
  }
}

/** Creates an account. A taken email comes back as a 400 with a readable message. */
export async function register(registration: Registration): Promise<void> {
  await apiRequest('/api/users/register', { method: 'POST', body: registration, auth: false })
}
