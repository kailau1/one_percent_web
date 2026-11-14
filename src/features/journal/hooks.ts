import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData, type QueryClient } from '@tanstack/react-query'
import type { JournalEntry, Page } from '@/api/types'
import { createEntry, deleteEntry, getEntry, getEntryDays, searchEntries, updateEntry, type EntryInput } from './api'

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

/** An entry already loaded in some list, so opening it from the list is instant. */
function findInLists(queryClient: QueryClient, id: string): JournalEntry | undefined {
  for (const [, data] of queryClient.getQueriesData<InfiniteData<Page<JournalEntry>> | Page<JournalEntry>>({ queryKey: journalKeys.all })) {
    const pages = data && 'pages' in data ? data.pages : data && 'items' in data ? [data] : []
    for (const page of pages) {
      const found = page.items.find((entry) => entry.id === id)
      if (found) return found
    }
  }
  return undefined
}

/** One entry. Shows the copy from the list straight away, then the server's. 404 → error.kind 'notFound'. */
export function useEntry(id: string | undefined) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: journalKeys.entry(id ?? ''),
    queryFn: () => getEntry(id!),
    enabled: Boolean(id),
    placeholderData: () => (id ? findInLists(queryClient, id) : undefined),
  })
}

/**
 * After an entry changes: the entry itself is set from the server's reply, and every list, page
 * and day count is refetched (a new or deleted entry shifts every page after it).
 */
export function entryChanged(queryClient: QueryClient, entry: JournalEntry) {
  queryClient.setQueryData(journalKeys.entry(entry.id), entry)
  queryClient.invalidateQueries({ queryKey: journalKeys.all, predicate: (query) => query.queryKey[1] !== 'entry' })
}

/** Creates (no id) or updates (id) an entry. */
export function useSaveEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: EntryInput }) => (id ? updateEntry(id, input) : createEntry(input)),
    onSuccess: (saved) => entryChanged(queryClient, saved),
  })
}

export function useDeleteEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteEntry,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: journalKeys.entry(id) })
      queryClient.invalidateQueries({ queryKey: journalKeys.all })
    },
  })
}
