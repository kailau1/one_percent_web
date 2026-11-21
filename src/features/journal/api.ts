import { apiRequest } from '@/api/client'
import type { JournalEntry, Page } from '@/api/types'

export interface EntryInput {
  title: string
  content: string
  /** Existing AI feedback. The backend overwrites it on update, so it must be sent back. */
  llmResponse?: string | null
}

/** How many entries the journal list loads at a time. */
export const ENTRIES_PAGE_SIZE = 20

/** One page of entries, newest first; `q` (if given) matches titles and text on the server. */
export function searchEntries({ q = '', page = 0, size = ENTRIES_PAGE_SIZE }: { q?: string; page?: number; size?: number }) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (q.trim()) params.set('q', q.trim())
  return apiRequest<Page<JournalEntry>>(`/api/journals?${params}`)
}

/** One entry (404 if it doesn't exist or isn't yours). */
export const getEntry = (id: string) => apiRequest<JournalEntry>(`/api/journals/entry/${encodeURIComponent(id)}`)

/** The days ("YYYY-MM-DD", in the user's time zone) with at least one entry, between two days inclusive. */
export const getEntryDays = (from: string, to: string) =>
  apiRequest<string[]>(`/api/journals/days?${new URLSearchParams({ from, to })}`).then((days) => days ?? [])

export const createEntry = (input: EntryInput) =>
  apiRequest<JournalEntry>('/api/journals', { method: 'POST', body: input })

export const updateEntry = (id: string, input: EntryInput) =>
  apiRequest<JournalEntry>('/api/journals/entry', { method: 'PUT', body: { id, ...input } })

/** Sets exactly which themes the entry has (the server stores them as corrections to its own tags). */
export const setEntryThemes = (id: string, themes: string[]) =>
  apiRequest<JournalEntry>(`/api/journals/entry/${encodeURIComponent(id)}/themes`, { method: 'PUT', body: { themes } })

export const deleteEntry = (id: string) => apiRequest<void>(`/api/journals/${id}`, { method: 'DELETE' })
