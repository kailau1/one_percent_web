import { apiRequest } from '@/api/client'
import type { UserProfile } from '@/api/types'

/** The logged-in user's profile, including their time zone. */
export const getProfile = () => apiRequest<UserProfile>('/api/users/me')

/** Sets where the user's days start and end (an IANA zone such as "Europe/London"). 400 if unknown. */
export const setTimeZone = (timeZone: string) =>
  apiRequest<UserProfile>('/api/users/me/time-zone', { method: 'PUT', body: { timeZone } })
