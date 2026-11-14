import { apiRequest } from '@/api/client'
import type { JournalEntry } from '@/api/types'

export interface EntryInput {
  title: string
  content: string
  /** Existing AI feedback. The backend overwrites it on update, so it must be sent back. */
  llmResponse?: string | null
}

export const listEntries = () => apiRequest<JournalEntry[]>('/api/journals/me').then((entries) => entries ?? [])

export const createEntry = (input: EntryInput) =>
  apiRequest<JournalEntry>('/api/journals', { method: 'POST', body: input })

export const updateEntry = (id: string, input: EntryInput) =>
  apiRequest<JournalEntry>('/api/journals/entry', { method: 'PUT', body: { id, ...input } })

export const deleteEntry = (id: string) => apiRequest<void>(`/api/journals/${id}`, { method: 'DELETE' })
