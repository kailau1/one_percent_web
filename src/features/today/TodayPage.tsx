import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ArrowRight, PenLine } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TipCard } from '@/features/ai/TipCard'
import { useUser } from '@/features/auth/useAuth'
import { HabitTitle } from '@/features/habits/components/HabitTitle'
import { HabitToggle } from '@/features/habits/components/HabitToggle'
import { habitTitle, safeColour } from '@/features/habits/habit'
import { useHabits, useRecentHistory, useToggleHabit } from '@/features/habits/hooks'
import { toDayNumber } from '@/features/habits/streaks'
import { useEntries } from '@/features/journal/hooks'
import { cn } from '@/lib/cn'
import { formatDay, parseDateTime } from '@/lib/dates'
import { activeDays } from './activity'
import { YearRibbon } from './YearRibbon'

function greeting(hour: number): string {
  if (hour < 5) return 'Still up'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/** The day at a glance: the year so far, today's habits, and a way into the journal. */
export function TodayPage() {
  const user = useUser()
  const [now] = useState(() => new Date())
  const habits = useHabits()
  const entries = useEntries()
  const history = useRecentHistory()
  const toggle = useToggleHabit()
  const queryClient = useQueryClient()

  // When several things fail at once (typically: the server is unreachable) show ONE banner with
  // ONE retry for the whole page, instead of an error and a button in every section.
  const failed = [habits, entries, history].filter((query) => query.error)
  const pageError = failed[0]?.error ?? null
  const retrying = failed.some((query) => query.isFetching)
  function retryAll() {
    for (const query of failed) query.refetch()
    queryClient.refetchQueries({ predicate: (query) => query.state.status === 'error' })
  }

  const active = useMemo(
    () => activeDays(entries.data, history.data, habits.data, now),
    [entries.data, history.data, habits.data, now],
  )

  const todayNumber = toDayNumber(now)
  const todaysEntry = entries.data?.find((entry) => {
    const written = parseDateTime(entry.createdAt)
    return written !== null && toDayNumber(written) === todayNumber
  })
  const recentEntries = entries.data?.slice(0, 3) ?? []
  const doneCount = habits.data?.filter((habit) => habit.completed).length ?? 0

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <header>
        <p className="mb-1 text-ink-muted">
          {greeting(now.getHours())}, {user.firstName}
        </p>
        <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">{format(now, 'EEEE d MMMM')}</h1>
      </header>

      {pageError && <ErrorState compact error={pageError} onRetry={retryAll} retrying={retrying} className="max-w-prose" />}

      <YearRibbon active={active} today={now} unavailable={(Boolean(history.error) && !history.data) || (Boolean(entries.error) && !entries.data)} />

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <section aria-labelledby="today-habits" className="min-w-0">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 id="today-habits" className="font-serif text-2xl">
              Today’s habits
            </h2>
            {habits.data && habits.data.length > 0 && (
              <p className="text-sm text-ink-muted">
                {doneCount} of {habits.data.length} done
              </p>
            )}
          </div>

          {habits.isPending && (
            <div role="status" aria-label="Loading habits" className="flex flex-col gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="size-9 rounded-full" />
                  <Skeleton className="h-5 flex-1" />
                </div>
              ))}
            </div>
          )}
          {habits.error && !habits.data && <p className="text-ink-muted">Not loaded.</p>}
          {habits.data && habits.data.length === 0 && (
            <p className="text-ink-muted">
              No habits yet.{' '}
              <Link to="/habits" className="font-medium text-action underline-offset-4 hover:underline">
                Add your first habit
              </Link>
            </p>
          )}
          {habits.data && habits.data.length > 0 && (
            <>
              <ul aria-label="Today’s habits">
                {habits.data.map((habit) => (
                  <li key={habit.id} className="flex items-center gap-4 border-b border-line py-3 last:border-b-0">
                    <HabitToggle
                      checked={habit.completed}
                      onChange={(completed) => toggle.mutate({ id: habit.id, completed })}
                      label={habitTitle(habit)}
                      colour={safeColour(habit.colour)}
                    />
                    <span className={cn('min-w-0 flex-1 truncate font-serif text-lg', habit.completed && 'text-ink-muted')}>
                      <HabitTitle habit={habit} muted={habit.completed} />
                    </span>
                  </li>
                ))}
              </ul>
              <Link to="/habits" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-action underline-offset-4 hover:underline">
                Streaks and history
                <ArrowRight aria-hidden className="size-3.5" />
              </Link>
            </>
          )}
        </section>

        <section aria-labelledby="today-journal" className="min-w-0">
          <h2 id="today-journal" className="mb-4 font-serif text-2xl">
            Journal
          </h2>

          <Button asChild size="lg" className="mb-6">
            <Link to={todaysEntry ? `/journal/${todaysEntry.id}` : '/journal/new'}>
              <PenLine aria-hidden />
              {todaysEntry ? 'Continue today’s entry' : 'Write today’s entry'}
            </Link>
          </Button>

          {entries.isPending && (
            <div role="status" aria-label="Loading entries" className="flex flex-col gap-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          )}
          {entries.error && !entries.data && <p className="text-ink-muted">Not loaded.</p>}
          {recentEntries.length > 0 && (
            <ul aria-label="Recent entries">
              {recentEntries.map((entry) => {
                const written = parseDateTime(entry.createdAt)
                return (
                  <li key={entry.id} className="border-b border-line last:border-b-0">
                    <Link to={`/journal/${entry.id}`} className="flex items-baseline justify-between gap-4 rounded-control py-3 hover:text-action">
                      <span className="truncate font-serif text-lg">{entry.title?.trim() || 'Untitled'}</span>
                      {written && <span className="shrink-0 text-sm text-ink-muted">{formatDay(written)}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
          {entries.data && entries.data.length === 0 && <p className="text-ink-muted">Nothing written yet. The first entry is the hardest; keep it short.</p>}
        </section>
      </div>

      <TipCard quietErrors={pageError !== null} />
    </div>
  )
}
