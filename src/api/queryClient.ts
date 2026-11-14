import { QueryClient } from '@tanstack/react-query'
import { toApiError } from './client'

/**
 * Retry only when retrying can help: the server was unreachable or had a hiccup. A 4xx means
 * the request itself is wrong (or the session expired), so asking again changes nothing.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  const { kind } = toApiError(error)
  const transient = kind === 'network' || kind === 'timeout' || kind === 'server'
  return transient && failureCount < 1
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  })
}
