import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { ApiError } from '@/api/client'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Page } from '@/components/layout/Page'
import { Skeleton } from '@/components/ui/skeleton'
import { useReflection, seenReflection } from './hooks'
import { ReflectionView } from './ReflectionView'
import { formatWeekRange, parseDay } from './weeks'
import { addDays, format } from 'date-fns'

/** /insights/week/:weekStart: one week read back, in full. */
export function WeekPage() {
  const { weekStart = '' } = useParams()
  const { data, error, isPending, refetch, isFetching } = useReflection(weekStart)
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(weekStart)
  const title = valid
    ? `Your week: ${formatWeekRange(weekStart, format(addDays(parseDay(weekStart), 6), 'yyyy-MM-dd'))}`
    : 'Your week'

  useEffect(() => {
    if (data?.status === 'ready') seenReflection.set(data.weekStart)
  }, [data])

  const notFound =
    error instanceof ApiError && (error.kind === 'notFound' || error.kind === 'badRequest')

  return (
    <Page title={title}>
      <Link
        to="/insights"
        className="-mt-4 mb-8 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-action"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Insights
      </Link>
      {isPending && (
        <div
          role="status"
          aria-label="Loading your week"
          className="flex max-w-prose flex-col gap-3"
        >
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      )}
      {notFound && (
        <EmptyState title="No reflection for this week" className="max-w-prose">
          A week is read back the first time you open Insights after it ends, if you wrote at least
          twice.
        </EmptyState>
      )}
      {error && !notFound && (
        <ErrorState
          error={error}
          onRetry={() => refetch()}
          retrying={isFetching}
          className="max-w-prose"
        />
      )}
      {data?.status === 'ready' && <ReflectionView reflection={data} />}
    </Page>
  )
}
