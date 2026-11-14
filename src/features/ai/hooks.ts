import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useState } from 'react'
import type { JournalEntry } from '@/api/types'
import { journalKeys } from '@/features/journal/hooks'
import { storage } from '@/lib/storage'
import { getPrompts, getTip, requestFeedback } from './api'

export const aiKeys = {
  prompts: ['ai', 'prompts'] as const,
  tip: (day: string) => ['ai', 'tip', day] as const,
}

/** Requests feedback for a saved entry and writes it into the cached entry when it arrives. */
export function useRequestFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: requestFeedback,
    onSuccess: (feedback, journalId) => {
      queryClient.setQueryData<JournalEntry[]>(journalKeys.all, (entries = []) =>
        entries.map((entry) => (entry.id === journalId ? { ...entry, llmResponse: feedback } : entry)),
      )
    },
  })
}

/** Prompt suggestions, fetched only once asked for (each request is a paid AI call). */
export function usePrompts(enabled: boolean) {
  return useQuery({ queryKey: aiKeys.prompts, queryFn: getPrompts, enabled, staleTime: 10 * 60_000 })
}

/**
 * The tip of the day. Kept in the browser for the rest of the day, so reloading the page
 * doesn't ask (and pay) for another one.
 */
export function useTipOfTheDay() {
  const [day] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const storageKey = `tip.${day}`
  return useQuery({
    queryKey: aiKeys.tip(day),
    queryFn: async () => {
      const tip = await getTip()
      if (tip) storage.set(storageKey, tip)
      return tip
    },
    initialData: () => storage.get(storageKey) ?? undefined,
    staleTime: Infinity,
  })
}
