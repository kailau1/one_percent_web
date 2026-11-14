import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Page } from '@/components/layout/Page'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { HabitDetail } from './components/HabitDetail'
import { HabitFormDialog } from './components/HabitFormDialog'
import { HabitRow } from './components/HabitRow'
import { useHabits, useRecentHistory, useToggleHabit } from './hooks'
import { calculateCurrentStreak, withToday } from './streaks'

export function HabitsPage() {
  const { data: habits, error, isPending, refetch, isFetching } = useHabits()
  const { data: history } = useRecentHistory()
  const toggle = useToggleHabit()
  const [adding, setAdding] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  // Current streak per habit, using the live "done today" state so a tick counts straight away.
  const streaks = useMemo(() => {
    const result = new Map<string, number>()
    for (const habit of habits ?? []) {
      const records = (history ?? []).filter((record) => record.habitId === habit.id)
      result.set(habit.id, calculateCurrentStreak(withToday(records, habit.completed)))
    }
    return result
  }, [habits, history])

  const doneCount = habits?.filter((habit) => habit.completed).length ?? 0
  const openHabit = habits?.find((habit) => habit.id === openId) ?? null

  return (
    <Page
      title="Habits"
      className="max-w-3xl"
      action={
        <Button onClick={() => setAdding(true)}>
          <Plus aria-hidden />
          New habit
        </Button>
      }
    >
      {isPending && (
        <div role="status" aria-label="Loading habits" className="flex flex-col gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-6 flex-1" />
            </div>
          ))}
        </div>
      )}

      {error && <ErrorState compact={Boolean(habits)} error={error} onRetry={() => refetch()} retrying={isFetching} className="mb-6" />}

      {habits && habits.length === 0 && (
        <EmptyState title="No habits yet" action={<Button onClick={() => setAdding(true)}>Add your first habit</Button>}>
          Start with one small thing you can do every day. Tick it off here and watch the streak build.
        </EmptyState>
      )}

      {habits && habits.length > 0 && (
        <>
          <p className="mb-2 text-ink-muted" role="status">
            {doneCount === habits.length ? `All ${habits.length} done today.` : `${doneCount} of ${habits.length} done today`}
          </p>
          <div
            role="progressbar"
            aria-label="Habits done today"
            aria-valuemin={0}
            aria-valuemax={habits.length}
            aria-valuenow={doneCount}
            className="mb-6 h-1.5 overflow-hidden rounded-full bg-sunken"
          >
            <div className="h-full rounded-full bg-sunrise transition-[width] duration-300" style={{ width: `${(doneCount / habits.length) * 100}%` }} />
          </div>

          <ul aria-label="Your habits">
            {habits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                streak={streaks.get(habit.id) ?? 0}
                onToggle={(completed) => toggle.mutate({ id: habit.id, completed })}
                onOpen={() => setOpenId(habit.id)}
              />
            ))}
          </ul>
        </>
      )}

      <HabitFormDialog open={adding} onOpenChange={setAdding} />
      <HabitDetail habit={openHabit} onClose={() => setOpenId(null)} onToggle={(habit, completed) => toggle.mutate({ id: habit.id, completed })} />
    </Page>
  )
}
