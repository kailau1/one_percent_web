import { Link } from 'react-router'
import { addDays } from 'date-fns'
import { seenReflection } from './hooks'
import { lastWeekStart, parseDay } from './weeks'

/**
 * On Today, Monday to Wednesday: a quiet pointer to last week's reflection until it's been seen.
 * It asks the server nothing (opening Today must never spend AI quota); it only shows if this
 * device's entry calendar says there were at least two days with entries last week.
 */
export function WeekReadyCard({
  entryDays,
  now,
}: {
  entryDays: string[] | undefined
  now: Date
}) {
  const day = now.getDay() // 0 Sunday … 6 Saturday
  if (day < 1 || day > 3 || !entryDays) return null
  const weekStart = lastWeekStart(now)
  if (seenReflection.get() === weekStart) return null
  const start = parseDay(weekStart)
  const end = addDays(start, 7)
  const daysWithEntries = entryDays.filter((d) => {
    const date = parseDay(d)
    return date >= start && date < end
  }).length
  if (daysWithEntries < 2) return null

  return (
    <aside aria-label="Last week" className="rounded-card border border-line bg-surface px-5 py-4">
      <p>
        Your week, read back to you, is ready.{' '}
        <Link
          to="/insights"
          className="font-medium text-action hover:text-action-hover hover:underline"
        >
          Read last week
        </Link>
      </p>
    </aside>
  )
}
