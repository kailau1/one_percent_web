import { AI_TIMEOUT_MS, apiRequest } from '@/api/client'
import type { Page, WeeklyReflection } from '@/api/types'

/** Last finished week. Written by the AI the first time it's asked for, so it can take a few seconds. */
export const getLatestReflection = () =>
  apiRequest<WeeklyReflection>('/api/reflections/latest', { timeoutMs: AI_TIMEOUT_MS })

/** A week already written (404 otherwise). */
export const getReflection = (weekStart: string) =>
  apiRequest<WeeklyReflection>(`/api/reflections/${encodeURIComponent(weekStart)}`)

/** Weeks already written, newest first. */
export const listReflections = (page = 0, size = 10) =>
  apiRequest<Page<WeeklyReflection>>(`/api/reflections?page=${page}&size=${size}`)
