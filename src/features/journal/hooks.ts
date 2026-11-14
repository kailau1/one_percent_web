import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { JournalEntry } from '@/api/types'
import { parseLocalDateTime } from '@/lib/dates'
import { createEntry, deleteEntry, listEntries, updateEntry, type EntryInput } from './api'

export const journalKeys = { all: ['journals'] as const }

function newestFirst(entries: JournalEntry[]): JournalEntry[] {
  const time = (entry: JournalEntry) => parseLocalDateTime(entry.createdAt)?.getTime() ?? 0
  return [...entries].sort((a, b) => time(b) - time(a))
}

/** Every entry, newest first. The list carries full content, so single entries are read from it. */
export function useEntries() {
  return useQuery({ queryKey: journalKeys.all, queryFn: listEntries, select: newestFirst })
}

/** One entry out of the list. `entry` is undefined while loading or if the ID doesn't exist. */
export function useEntry(id: string | undefined) {
  const query = useEntries()
  return { ...query, entry: id ? query.data?.find((e) => e.id === id) : undefined }
}

/** Creates (no id) or updates (id) an entry, then puts the server's version into the cached list. */
export function useSaveEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: EntryInput }) => (id ? updateEntry(id, input) : createEntry(input)),
    onSuccess: (saved) => {
      queryClient.setQueryData<JournalEntry[]>(journalKeys.all, (entries = []) =>
        entries.some((e) => e.id === saved.id) ? entries.map((e) => (e.id === saved.id ? saved : e)) : [saved, ...entries],
      )
    },
  })
}

export function useDeleteEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteEntry,
    onSuccess: (_, id) => {
      queryClient.setQueryData<JournalEntry[]>(journalKeys.all, (entries = []) => entries.filter((e) => e.id !== id))
    },
  })
}
