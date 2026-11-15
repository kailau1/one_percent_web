import { NavLink } from 'react-router'
import type { JournalEntry } from '@/api/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { formatDay, formatMonth, parseDateTime } from '@/lib/dates'

/** The first couple of lines of an entry, on one line. */
function excerpt(content: string): string {
  return content.replace(/\s+/g, ' ').trim().slice(0, 140)
}

/** Groups entries (already newest first) under "Month Year" headings, keeping their order. */
function groupByMonth(entries: JournalEntry[]): { month: string; entries: JournalEntry[] }[] {
  const groups: { month: string; entries: JournalEntry[] }[] = []
  for (const entry of entries) {
    const date = parseDateTime(entry.createdAt)
    const month = date ? formatMonth(date) : 'Undated'
    const last = groups[groups.length - 1]
    if (last?.month === month) last.entries.push(entry)
    else groups.push({ month, entries: [entry] })
  }
  return groups
}

interface EntryListProps {
  entries: JournalEntry[]
  /** Whether the server has older entries than the ones shown. */
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
}

/** Entries grouped by month, newest first, with a way to load older ones. */
export function EntryList({ entries, hasMore, loadingMore, onLoadMore }: EntryListProps) {
  const groups = groupByMonth(entries)

  return (
    <>
      {groups.map((group) => (
        <section key={group.month} aria-label={group.month}>
          <h2 className="sticky top-0 bg-paper px-3 pb-1.5 pt-4 text-sm font-medium text-ink-muted">{group.month}</h2>
          <ul>
            {group.entries.map((entry) => {
              const date = parseDateTime(entry.createdAt)
              return (
                <li key={entry.id}>
                  <NavLink
                    to={`/journal/${entry.id}`}
                    className={({ isActive }) =>
                      cn('block rounded-control px-3 py-2.5 transition-colors', isActive ? 'bg-sky-wash' : 'hover:bg-sunken')
                    }
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate font-serif text-[1.0625rem] font-medium">{entry.title?.trim() || 'Untitled'}</span>
                      {date && <span className="shrink-0 text-sm text-ink-muted">{formatDay(date)}</span>}
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-sm text-ink-muted">{excerpt(entry.content ?? '')}</span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
      {hasMore && (
        <div className="px-3 pt-3">
          <Button variant="secondary" size="sm" className="w-full" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Older entries'}
          </Button>
        </div>
      )}
    </>
  )
}
