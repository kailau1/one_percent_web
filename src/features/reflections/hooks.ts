import { useQuery } from '@tanstack/react-query'
import { storage } from '@/lib/storage'
import { getLatestReflection, getReflection, listReflections } from './api'

export const reflectionKeys = {
  all: ['reflections'] as const,
  latest: ['reflections', 'latest'] as const,
  week: (weekStart: string) => ['reflections', 'week', weekStart] as const,
  list: ['reflections', 'list'] as const,
}

/**
 * Last week's reflection. Never retried automatically: a retry could make another AI request, and
 * the free AI tier allows few a day. The user retries by hand from the error message.
 */
export function useLatestReflection() {
  return useQuery({
    queryKey: reflectionKeys.latest,
    queryFn: getLatestReflection,
    retry: false,
    staleTime: 5 * 60_000,
  })
}

export function useReflection(weekStart: string) {
  return useQuery({
    queryKey: reflectionKeys.week(weekStart),
    queryFn: () => getReflection(weekStart),
  })
}

export function useReflectionHistory() {
  return useQuery({ queryKey: reflectionKeys.list, queryFn: () => listReflections() })
}

// Which week's reflection the user has already seen, so Today stops pointing at it.
const SEEN_KEY = 'reflection.seen'
export const seenReflection = {
  get: (): string | null => storage.getJson<string>(SEEN_KEY),
  set: (weekStart: string) => storage.setJson(SEEN_KEY, weekStart),
}
