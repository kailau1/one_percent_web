import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet, useMatch } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { EntryList } from './components/EntryList'
import { useEntryPages } from './hooks'

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-5 pt-2" aria-label="Loading entries" role="status">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  )
}

/**
 * The journal's two panes: the entry list on the left and whichever entry is open on the right.
 * Below 1024px only one shows at a time: the list at /journal, the entry at /journal/:id.
 * The list comes from the server a page at a time, and search runs there too, so it covers every
 * entry, not just the ones loaded.
 */
export function JournalLayout() {
  const [query, setQuery] = useState('')
  const search = useDebouncedValue(query.trim())
  const { data, error, isPending, refetch, isFetching, isFetchingNextPage, isPlaceholderData, hasNextPage, fetchNextPage } =
    useEntryPages(search)
  // If the journal changed between page loads, pages can overlap by an entry: show each once.
  const entries = data && [...new Map(data.pages.flatMap((page) => page.items).map((entry) => [entry.id, entry])).values()]
  const total = data?.pages[0]?.totalItems ?? 0
  const atIndex = useMatch('/journal') !== null
  const searching = search !== ''
  // still showing the previous search's results while this one loads
  const stale = isPlaceholderData || query.trim() !== search

  return (
    <div className="flex h-full min-h-0 lg:h-dvh">
      <section
        aria-label="Journal entries"
        className={cn('w-full shrink-0 flex-col border-line lg:flex lg:w-72 lg:border-r', atIndex ? 'flex' : 'hidden')}
      >
        <div className="flex items-center justify-between gap-3 px-5 pb-5 pt-8 lg:pt-12">
          <h1 className="font-serif text-4xl font-medium tracking-tight lg:text-3xl">Journal</h1>
          <Button asChild size="sm">
            <Link to="/journal/new" title="New entry (N)">
              <Plus aria-hidden />
              New entry
            </Link>
          </Button>
        </div>

        {/* No search box until there's something to search. */}
        {(searching || (entries && entries.length > 0)) && (
          <div className="relative px-4 pb-3">
            <Search aria-hidden className="pointer-events-none absolute left-7 top-3 size-4 text-ink-faint" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search entries"
              aria-label="Search entries"
              maxLength={200}
              className="h-10 w-full rounded-control border border-line bg-surface pl-9 pr-3 text-[0.9375rem] placeholder:text-ink-faint"
            />
          </div>
        )}

        {error && (
          <ErrorState compact={Boolean(entries)} error={error} onRetry={() => refetch()} retrying={isFetching} className="mx-4 mb-3" />
        )}

        {!searching && entries && entries.length === 0 && !stale && (
          <EmptyState
            title="Your journal is empty"
            className="mx-4"
            action={
              <Button asChild>
                <Link to="/journal/new">Write your first entry</Link>
              </Button>
            }
          >
            Entries you write appear here, newest first.
          </EmptyState>
        )}

        {isPending && <ListSkeleton />}
        {entries && (searching || entries.length > 0) && (
          <nav
            aria-label="Entries"
            aria-busy={stale || undefined}
            className={cn('min-h-0 flex-1 overflow-y-auto px-2 pb-6 transition-opacity', stale && 'opacity-60')}
          >
            {searching && !stale && (
              <p role="status" className="px-3 pb-1 text-sm text-ink-muted">
                {total === 0 ? `No entries match “${search}”.` : `${total} ${total === 1 ? 'entry matches' : 'entries match'} “${search}”`}
              </p>
            )}
            {entries.length > 0 && (
              <EntryList entries={entries} hasMore={Boolean(hasNextPage) && !stale} loadingMore={isFetchingNextPage} onLoadMore={() => fetchNextPage()} />
            )}
          </nav>
        )}
      </section>

      <section aria-label="Selected entry" className={cn('min-w-0 flex-1 overflow-y-auto lg:block', atIndex ? 'hidden' : 'block')}>
        <Outlet />
      </section>
    </div>
  )
}
