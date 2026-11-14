import { useMemo } from 'react'
import { toDayNumber } from '@/features/habits/streaks'
import { compounded } from './activity'

const STEP = 3 // viewBox units per day: a 2-unit mark and a 1-unit gap
const TALL = 46
const SHORT = 10
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface StripProps {
  first: number
  count: number
  today: number
  active: Set<number>
  /** [day number, label] pairs drawn under the strip. */
  labels: [number, string][]
  className?: string
}

/** A row of day marks: tall where the user showed up, short where they didn't, faint for days to come. */
function Strip({ first, count, today, active, labels, className }: StripProps) {
  return (
    <svg viewBox={`0 0 ${count * STEP} ${TALL + 18}`} className={className} aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const day = first + i
        const isActive = active.has(day)
        const isToday = day === today
        const height = isActive ? TALL : SHORT
        return (
          <rect
            key={day}
            x={i * STEP}
            y={TALL - height}
            width={STEP - 1}
            height={height}
            rx={1}
            className="ribbon-mark"
            style={{ animationDelay: `${Math.min(i * 2, 700)}ms` }}
            fill={isToday ? 'var(--sunrise)' : isActive ? 'var(--sky)' : 'var(--ink-faint)'}
            opacity={isToday || isActive ? 1 : day > today ? 0.2 : 0.45}
          />
        )
      })}
      {labels.map(([day, label]) => (
        <text key={day} x={(day - first) * STEP} y={TALL + 15} className="fill-ink-muted text-[11px]">
          {label}
        </text>
      ))}
    </svg>
  )
}

interface YearRibbonProps {
  /** Day numbers on which the user wrote or completed a habit (see activeDays). */
  active: Set<number>
  today: Date
  /** The data behind the ribbon failed to load, so its marks can't be trusted. */
  unavailable?: boolean
}

/**
 * The year so far, one mark per day. The app's central idea made visible: each day you show up
 * is a taller mark, and the line underneath says what that many days compound to.
 * Wide screens show the whole year; narrow ones the last twelve weeks.
 */
export function YearRibbon({ active, today, unavailable = false }: YearRibbonProps) {
  const year = today.getFullYear()
  const todayNumber = toDayNumber(today)

  const { firstOfYear, daysInYear, monthLabels, daysSoFar, activeSoFar } = useMemo(() => {
    const firstOfYear = toDayNumber(new Date(year, 0, 1))
    const daysInYear = toDayNumber(new Date(year + 1, 0, 1)) - firstOfYear
    const monthLabels = MONTHS.map((label, month): [number, string] => [toDayNumber(new Date(year, month, 1)), label])
    let activeSoFar = 0
    for (let day = firstOfYear; day <= todayNumber; day++) if (active.has(day)) activeSoFar++
    return { firstOfYear, daysInYear, monthLabels, daysSoFar: todayNumber - firstOfYear + 1, activeSoFar }
  }, [year, todayNumber, active])

  const recentFirst = todayNumber - 83
  const recentLabels = useMemo(
    () =>
      [0, 4, 8].map((weeks): [number, string] => {
        const day = recentFirst + weeks * 7
        return [day, new Date(day * 86_400_000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })]
      }),
    [recentFirst],
  )

  return (
    <section aria-label="Your year">
      <div role="img" aria-label={unavailable ? 'Your year so far isn’t loaded' : `You showed up on ${activeSoFar} of ${daysSoFar} days so far this year`}>
        <Strip className="hidden w-full sm:block" first={firstOfYear} count={daysInYear} today={todayNumber} active={active} labels={monthLabels} />
        <Strip className="w-full sm:hidden" first={recentFirst} count={84} today={todayNumber} active={active} labels={recentLabels} />
      </div>
      <p className="mt-4 max-w-prose font-serif text-xl leading-8">
        {unavailable ? (
          <span className="text-ink-muted">Your year so far isn’t loaded.</span>
        ) : activeSoFar === 0 ? (
          'Every mark is a day. Write an entry or tick a habit to make today’s the first tall one.'
        ) : (
          <>
            You’ve shown up on {activeSoFar} {activeSoFar === 1 ? 'day' : 'days'} this year. One percent better each of those days compounds to{' '}
            <span className="whitespace-nowrap">{compounded(activeSoFar).toFixed(2)}×</span>.
          </>
        )}
      </p>
    </section>
  )
}
