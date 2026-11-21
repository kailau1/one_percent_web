import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api/client'
import type { AiContext, AiContextSettings } from '@/api/types'
import { addFact, deleteFact, getAiContext, updateAiSettings } from './api'

export const aboutYouKeys = { context: ['ai-context'] as const }

/** Always re-read on opening the page: habits and themes change elsewhere in the app. */
export function useAiContext() {
  return useQuery({ queryKey: aboutYouKeys.context, queryFn: getAiContext, staleTime: 0 })
}

/** Not optimistic: the form keeps the text until the server accepts it, and shows its reason if not. */
export function useAddFact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addFact,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aboutYouKeys.context }),
  })
}

/** Optimistic: the fact disappears at once, and comes back with a message if the server refuses. */
export function useDeleteFact() {
  const queryClient = useQueryClient()
  const key = aboutYouKeys.context
  return useMutation({
    mutationFn: deleteFact,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<AiContext>(key)
      if (previous)
        queryClient.setQueryData<AiContext>(key, {
          ...previous,
          facts: previous.facts.filter((f) => f.id !== id),
        })
      return { previous }
    },
    onError: (error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      toast.error(getErrorMessage(error))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }), // the preview text changes too
  })
}

/** Optimistic switches; the server's reply carries the new preview. */
export function useUpdateAiSettings() {
  const queryClient = useQueryClient()
  const key = aboutYouKeys.context
  return useMutation({
    mutationFn: updateAiSettings,
    onMutate: async (settings: AiContextSettings) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<AiContext>(key)
      if (previous) queryClient.setQueryData<AiContext>(key, { ...previous, settings })
      return { previous }
    },
    onError: (error, _settings, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      toast.error(getErrorMessage(error))
    },
    onSuccess: (saved) => queryClient.setQueryData(key, saved),
  })
}
