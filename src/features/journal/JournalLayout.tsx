import { Plus } from 'lucide-react'
import { Link, Outlet, useMatch } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { EntryList } from './components/EntryList'
import { useEntries } from './hooks'

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
 */
export function JournalLayout() {
  const { data: entries, error, isPending, refetch, isFetching } = useEntries()
  const atIndex = useMatch('/journal') !== null

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

        {isPending && <ListSkeleton />}
        {error && (
          <ErrorState compact={Boolean(entries)} error={error} onRetry={() => refetch()} retrying={isFetching} className="mx-4 mb-3" />
        )}
        {entries && entries.length === 0 && (
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
        {entries && entries.length > 0 && <EntryList entries={entries} />}
      </section>

      <section aria-label="Selected entry" className={cn('min-w-0 flex-1 overflow-y-auto lg:block', atIndex ? 'hidden' : 'block')}>
        <Outlet />
      </section>
    </div>
  )
}
