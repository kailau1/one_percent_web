import { Link, useParams } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EntryEditor } from './components/EntryEditor'
import { useEntry } from './hooks'

/** /journal/:id: one entry, open for reading and editing. */
export function EntryPage() {
  const { id } = useParams()
  const { entry, isPending, error, data } = useEntry(id)

  if (isPending) {
    return (
      <div className="mx-auto flex max-w-prose flex-col gap-4 px-8 pt-24" role="status" aria-label="Loading entry">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
      </div>
    )
  }

  // The list failed to load: the left pane already shows the error and a retry.
  if (error && !data) return null

  if (!entry) {
    return (
      <div className="mx-auto max-w-prose px-8 pt-24">
        <EmptyState
          title="This entry doesn’t exist"
          action={
            <Button asChild variant="secondary">
              <Link to="/journal">Back to your journal</Link>
            </Button>
          }
        >
          It may have been deleted.
        </EmptyState>
      </div>
    )
  }

  // `key` gives each entry its own editor state, so switching entries never mixes their text.
  return <EntryEditor key={entry.id} entry={entry} />
}
