import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { useTipOfTheDay } from './hooks'

/**
 * Today's tip. Asked for once a day and remembered until tomorrow.
 * `quietErrors`: the page is already showing one error banner for everything, so don't add another.
 */
export function TipCard({ quietErrors = false }: { quietErrors?: boolean }) {
  const { data: tip, error, isPending, isFetching, refetch } = useTipOfTheDay()

  return (
    <section aria-label="Tip of the day">
      <h2 className="mb-3 font-serif text-2xl">Tip of the day</h2>
      {isPending && (
        <div role="status" aria-label="Loading tip" className="flex max-w-prose flex-col gap-2.5">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      )}
      {Boolean(error) && !tip && quietErrors && <p className="text-ink-muted">Not loaded.</p>}
      {Boolean(error) && !tip && !quietErrors && <ErrorState compact error={error} onRetry={() => refetch()} retrying={isFetching} className="max-w-prose" />}
      {tip && <p className="max-w-prose font-serif text-xl leading-8">{tip}</p>}
    </section>
  )
}
