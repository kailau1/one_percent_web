import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { NavLink } from 'react-router'
import type { JournalEntry } from '@/api/types'
import { cn } from '@/lib/cn'
import { formatDay, formatMonth, parseLocalDateTime } from '@/lib/dates'

/** The first couple of lines of an entry, on one line. */
function excerpt(content: string): string {
  return content.replace(/\s+/g, ' ').trim().slice(0, 140)
}

function matches(entry: JournalEntry, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return entry.title?.toLowerCase().includes(q) || entry.content?.toLowerCase().includes(q)
}

/** Groups entries (already newest first) under "Month Year" headings, keeping their order. */
function groupByMonth(entries: JournalEntry[]): { month: string; entries: JournalEntry[] }[] {
  const groups: { month: string; entries: JournalEntry[] }[] = []
  for (const entry of entries) {
    const date = parseLocalDateTime(entry.createdAt)
    const month = date ? formatMonth(date) : 'Undated'
    const last = groups[groups.length - 1]
    if (last?.month === month) last.entries.push(entry)
    else groups.push({ month, entries: [entry] })
  }
  return groups
}

/** Searchable list of entries, grouped by month. */
export function EntryList({ entries }: { entries: JournalEntry[] }) {
  const [query, setQuery] = useState('')
  const groups = useMemo(() => groupByMonth(entries.filter((entry) => matches(entry, query))), [entries, query])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative px-4 pb-3">
        <Search aria-hidden className="pointer-events-none absolute left-7 top-3 size-4 text-ink-faint" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search entries"
          aria-label="Search entries"
          className="h-10 w-full rounded-control border border-line bg-surface pl-9 pr-3 text-[0.9375rem] placeholder:text-ink-faint"
        />
      </div>

      <nav aria-label="Entries" className="min-h-0 flex-1 overflow-y-auto px-2 pb-6">
        {groups.length === 0 && (
          <p className="px-3 py-6 text-ink-muted">No entries match “{query.trim()}”.</p>
        )}
        {groups.map((group) => (
          <section key={group.month} aria-label={group.month}>
            <h2 className="sticky top-0 bg-paper px-3 pb-1.5 pt-4 text-sm font-medium text-ink-muted">{group.month}</h2>
            <ul>
              {group.entries.map((entry) => {
                const date = parseLocalDateTime(entry.createdAt)
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
      </nav>
    </div>
  )
}
