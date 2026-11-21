import { Link } from 'react-router'
import type { ThemeInsights } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Page } from '@/components/layout/Page'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDay, parseDateTime } from '@/lib/dates'
import { useThemeInsights } from './hooks'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

function InsightsSkeleton() {
  return (
    <div role="status" aria-label="Loading insights" className="flex max-w-3xl flex-col gap-8">
      <Skeleton className="h-5 w-72" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-1.5 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  )
}

function ThemeList({ insights }: { insights: ThemeInsights }) {
  const { analysedEntries, totalEntries, themes } = insights
  const skipped = totalEntries - analysedEntries

  return (
    <div className="max-w-3xl">
      <p className="text-ink-muted">
        What your journal keeps coming back to, across {plural(analysedEntries, 'entry', 'entries')}.
        {skipped > 0 && ` ${plural(skipped, 'entry was', 'entries were')} saved while AI analysis was unavailable, so ${skipped === 1 ? 'it isn’t' : 'they aren’t'} included.`}
      </p>

      <ul aria-label="Themes" className="mt-6">
        {themes.map((theme) => {
          const share = analysedEntries > 0 ? theme.entryCount / analysedEntries : 0
          return (
            <li key={theme.name} className="border-b border-line py-5 last:border-b-0">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-serif text-xl">{capitalise(theme.name)}</h2>
                <span className="shrink-0 text-ink-muted">in {plural(theme.entryCount, 'entry', 'entries')}</span>
              </div>
              {/* the count is in the text above; the bar only shows it at a glance */}
              <div aria-hidden className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-sunken">
                <div className="h-full rounded-full bg-sky" style={{ width: `${Math.max(share * 100, 2)}%` }} />
              </div>
              {theme.recentEntries.length > 0 && (
                <ul aria-label={`Recent entries about ${theme.name}`} className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  {theme.recentEntries.map((entry) => {
                    const written = parseDateTime(entry.createdAt)
                    return (
                      <li key={entry.id}>
                        <Link to={`/journal/${entry.id}`} className="text-action hover:text-action-hover hover:underline">
                          {entry.title?.trim() || 'Untitled'}
                        </Link>
                        {written && <span className="text-ink-muted"> · {formatDay(written)}</span>}
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>

      <p className="mt-6 text-sm text-ink-muted">
        Each entry counts towards the three themes it’s closest to, so the counts add up to more than your number of entries.
      </p>
    </div>
  )
}

/** /insights: the themes the user writes about most, with a way back into those entries. */
export function InsightsPage() {
  const { data, error, isPending, refetch, isFetching } = useThemeInsights()

  return (
    <Page title="Insights">
      {isPending && <InsightsSkeleton />}
      {error && <ErrorState compact={Boolean(data)} error={error} onRetry={() => refetch()} retrying={isFetching} className="mb-6 max-w-3xl" />}
      {data && data.totalEntries === 0 && (
        <EmptyState
          title="No themes yet"
          className="max-w-3xl"
          action={
            <Button asChild>
              <Link to="/journal/new">Write an entry</Link>
            </Button>
          }
        >
          Once you’ve written a few entries, the themes you keep returning to will show up here.
        </EmptyState>
      )}
      {data && data.totalEntries > 0 && data.analysedEntries === 0 && (
        <EmptyState title="Your entries haven’t been analysed yet" className="max-w-3xl">
          Themes come from AI analysis, which wasn’t available when these entries were saved. New entries, and entries you
          edit, are analysed as they’re saved.
        </EmptyState>
      )}
      {data && data.analysedEntries > 0 && <ThemeList insights={data} />}
    </Page>
  )
}
