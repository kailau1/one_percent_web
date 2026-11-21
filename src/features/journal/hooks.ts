import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData, type QueryClient } from '@tanstack/react-query'
import type { JournalEntry, Page } from '@/api/types'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api/client'
import { createEntry, deleteEntry, getEntry, getEntryDays, searchEntries, setEntryThemes, updateEntry, type EntryInput } from './api'

export const journalKeys = {
  all: ['journals'] as const,
  lists: ['journals', 'list'] as const,
  list: (q: string) => ['journals', 'list', q.trim()] as const,
  recent: (count: number) => ['journals', 'recent', count] as const,
  entry: (id: string) => ['journals', 'entry', id] as const,
  days: (from: string, to: string) => ['journals', 'days', from, to] as const,
}

/**
 * The journal list, a page at a time, newest first. `q` searches titles and text on the server.
 * While a new search loads, the previous results stay on screen instead of flashing empty.
 */
export function useEntryPages(q = '') {
  return useInfiniteQuery({
    queryKey: journalKeys.list(q),
    queryFn: ({ pageParam }) => searchEntries({ q, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last: Page<JournalEntry>) => (last.hasNext ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  })
}

/** The newest few entries (the Today page's "recent entries"). */
export function useRecentEntries(count = 3) {
  return useQuery({ queryKey: journalKeys.recent(count), queryFn: () => searchEntries({ size: count }) })
}

/** The days with at least one entry, for the year ribbon and streaks. */
export function useEntryDays(from: string, to: string) {
  return useQuery({ queryKey: journalKeys.days(from, to), queryFn: () => getEntryDays(from, to) })
}

/**
 * One entry, always the server's current copy. (Not the list's copy as a placeholder: the editor
 * takes its text once when it opens, so a stale copy could be saved over a newer one.)
 * 404 → error.kind 'notFound'.
 */
export function useEntry(id: string | undefined) {
  return useQuery({ queryKey: journalKeys.entry(id ?? ''), queryFn: () => getEntry(id!), enabled: Boolean(id) })
}

type ListData = InfiniteData<Page<JournalEntry>> | Page<JournalEntry>

/** Swaps the new version of an entry into every cached list page that holds it. */
function patchLists(queryClient: QueryClient, entry: JournalEntry) {
  const swap = (page: Page<JournalEntry>) => ({ ...page, items: page.items.map((e) => (e.id === entry.id ? entry : e)) })
  queryClient.setQueriesData<ListData>({ queryKey: journalKeys.lists }, (data) => data && 'pages' in data ? { ...data, pages: data.pages.map(swap) } : data)
  queryClient.setQueriesData<ListData>({ queryKey: ['journals', 'recent'] }, (data) => (data && 'items' in data ? swap(data) : data))
}

/**
 * After an entry is edited (or gets feedback): its own cache and every list holding it are patched
 * in place. Its position can't have changed, so there's nothing to refetch... except search
 * results, which may now match differently.
 */
export function entryEdited(queryClient: QueryClient, entry: JournalEntry) {
  queryClient.setQueryData(journalKeys.entry(entry.id), entry)
  patchLists(queryClient, entry)
  queryClient.invalidateQueries({ queryKey: journalKeys.lists, predicate: (query) => query.queryKey[2] !== '' })
  queryClient.invalidateQueries({ queryKey: DERIVED_FROM_ENTRIES }) // edited text can change its themes
}

/** Queries computed from the journal on the server (the insights page): stale whenever entries change. */
const DERIVED_FROM_ENTRIES = ['insights'] as const

/** After an entry is created or deleted: every page after it shifts, so lists and days are refetched. */
function entryAddedOrRemoved(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: journalKeys.all, predicate: (query) => query.queryKey[1] !== 'entry' })
  queryClient.invalidateQueries({ queryKey: DERIVED_FROM_ENTRIES })
}

/** Creates (no id) or updates (id) an entry. */
export function useSaveEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: EntryInput }) => (id ? updateEntry(id, input) : createEntry(input)),
    onSuccess: (saved, { id }) => {
      if (id) {
        entryEdited(queryClient, saved)
      } else {
        queryClient.setQueryData(journalKeys.entry(saved.id), saved)
        entryAddedOrRemoved(queryClient)
      }
    },
  })
}

/**
 * Changes an entry's themes. Optimistic: the chips change at once and roll back with a message if the
 * server refuses; on success the entry, its list copies and the insights page are refreshed.
 */
export function useSetEntryThemes(id: string) {
  const queryClient = useQueryClient()
  const key = journalKeys.entry(id)
  return useMutation({
    mutationFn: (themes: string[]) => setEntryThemes(id, themes),
    onMutate: async (themes) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<JournalEntry>(key)
      if (previous) queryClient.setQueryData<JournalEntry>(key, { ...previous, themes })
      return { previous }
    },
    onError: (error, _themes, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      toast.error(getErrorMessage(error))
    },
    onSuccess: (saved) => entryEdited(queryClient, saved),
  })
}

export function useDeleteEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteEntry,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: journalKeys.entry(id) })
      entryAddedOrRemoved(queryClient)
    },
  })
}
