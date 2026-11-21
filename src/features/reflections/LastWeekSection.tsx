import { useEffect } from 'react'
import { Link } from 'react-router'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { seenReflection, useLatestReflection, useReflectionHistory } from './hooks'
import { entries, formatWeekRange } from './weeks'

/**
 * The top of Insights: last week read back (written on the first visit after the week ends, which
 * takes a few seconds), and links to earlier weeks.
 */
export function LastWeekSection() {
  const { data, error, isPending, refetch, isFetching } = useLatestReflection()
  const history = useReflectionHistory()
  const earlier = (history.data?.items ?? []).filter((week) => week.weekStart !== data?.weekStart)

  useEffect(() => {
    if (data?.status === 'ready') seenReflection.set(data.weekStart)
  }, [data])

  return (
    <section aria-labelledby="last-week" className="mb-12 max-w-3xl">
      <h2 id="last-week" className="mb-3 font-serif text-2xl">
        Last week
      </h2>
      {isPending && (
        <div
          role="status"
          aria-label="Reading back your week"
          className="flex flex-col gap-3 rounded-card border border-line bg-surface p-6"
        >
          <p className="text-sm text-ink-muted">Reading back your week…</p>
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      )}
      {error && (
        <ErrorState compact error={error} onRetry={() => refetch()} retrying={isFetching} />
      )}
      {data?.status === 'notEnoughEntries' && (
        <p className="text-ink-muted">
          {data.entryCount === 0
            ? 'Nothing was written'
            : `Only ${entries(data.entryCount)} was written`}{' '}
          between {formatWeekRange(data.weekStart, data.weekEnd)}. Write at least twice in a week
          and it’s read back to you here the Monday after.
        </p>
      )}
      {data?.status === 'ready' && (
        <div className="rounded-card border border-line bg-surface p-6">
          <p className="mb-2 text-sm text-ink-muted">
            {formatWeekRange(data.weekStart, data.weekEnd)}
          </p>
          <p className="font-serif text-lg leading-8">{data.opening}</p>
          {data.question && <p className="mt-4 text-ink-muted">{data.question}</p>}
          <Link
            to={`/insights/week/${data.weekStart}`}
            className="mt-5 inline-block font-medium text-action hover:text-action-hover hover:underline"
          >
            Read your week
          </Link>
        </div>
      )}
      {earlier.length > 0 && (
        <nav aria-label="Earlier weeks" className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <span className="text-ink-muted">Earlier:</span>
          {earlier.map((week) => (
            <Link
              key={week.weekStart}
              to={`/insights/week/${week.weekStart}`}
              className="text-action hover:underline"
            >
              {formatWeekRange(week.weekStart, week.weekEnd)}
            </Link>
          ))}
        </nav>
      )}
    </section>
  )
}
