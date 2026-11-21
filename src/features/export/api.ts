import type { JournalEntry } from '@/api/types'
import { getEntry, searchEntries } from '@/features/journal/api'

/** The largest page the server will send (JournalService.MAX_PAGE_SIZE). */
const EXPORT_PAGE_SIZE = 100

/**
 * Every entry the user has, oldest first (the order a journal is read in). Fetched a page at a
 * time, because the server caps page size.
 */
export async function fetchAllEntries(): Promise<JournalEntry[]> {
  const entries: JournalEntry[] = []
  for (let page = 0; ; page++) {
    const result = await searchEntries({ page, size: EXPORT_PAGE_SIZE })
    entries.push(...result.items)
    if (!result.hasNext) break
  }
  return entries.reverse()
}

/** One entry or all of them, for the print page. */
export const fetchEntriesForExport = (entryId: string | null): Promise<JournalEntry[]> =>
  entryId ? getEntry(entryId).then((entry) => [entry]) : fetchAllEntries()
