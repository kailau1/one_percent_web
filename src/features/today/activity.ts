import type { Habit, HabitHistoryRecord } from '@/api/types'
import { toDayNumber } from '@/features/habits/streaks'

/**
 * The days (as day numbers) on which the user "showed up": wrote a journal entry or completed
 * at least one habit. Today's live habit ticks count before the history is refetched.
 * `entryDays` are "YYYY-MM-DD" days with an entry (GET /api/journals/days).
 */
export function activeDays(
  entryDays: string[] = [],
  history: HabitHistoryRecord[] = [],
  habits: Habit[] = [],
  today: Date = new Date(),
): Set<number> {
  const days = new Set<number>()
  for (const day of entryDays) days.add(toDayNumber(day))
  const todayNumber = toDayNumber(today)
  for (const record of history) {
    // today is decided by the live habit list below, so an un-tick is reflected immediately
    if (record.completed && toDayNumber(record.date) !== todayNumber) days.add(toDayNumber(record.date))
  }
  if (habits.some((habit) => habit.completed)) days.add(todayNumber)
  return days
}

/** What n days of getting 1% better multiply up to: 1.01^n. */
export function compounded(days: number): number {
  return Math.pow(1.01, days)
}
