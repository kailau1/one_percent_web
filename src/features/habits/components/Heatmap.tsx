import { useMemo, useState } from 'react'
import { completedDays, toDayNumber, type DayRecord } from '../streaks'

const MS_PER_DAY = 24 * 60 * 60 * 1000
const WEEKDAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']

interface HeatmapProps {
  history: DayRecord[]
  colour: string
  /** How many weeks to show, ending with the current week. */
  weeks?: number
  today?: Date
}

/** A calendar of recent weeks (columns) by weekday (rows): filled on days the habit was done. */
export function Heatmap({ history, colour, weeks = 18, today }: HeatmapProps) {
  const [now] = useState(() => new Date())
  const todayNumber = toDayNumber(today ?? now)

  const { columns, doneCount, dayCount } = useMemo(() => {
    const done = completedDays(history)
    // 1 Jan 1970 was a Thursday, so (day number + 3) % 7 is 0 on Mondays
    const weekday = (((todayNumber + 3) % 7) + 7) % 7
    const firstDay = todayNumber - weekday - (weeks - 1) * 7

    const columns = Array.from({ length: weeks }, (_, week) =>
      Array.from({ length: 7 }, (_, day) => {
        const dayNumber = firstDay + week * 7 + day
        return { dayNumber, future: dayNumber > todayNumber, isDone: done.has(dayNumber), isToday: dayNumber === todayNumber }
      }),
    )
    const past = columns.flat().filter((cell) => !cell.future)
    return { columns, dayCount: past.length, doneCount: past.filter((cell) => cell.isDone).length }
  }, [history, weeks, todayNumber])

  const describe = (dayNumber: number) =>
    new Date(dayNumber * MS_PER_DAY).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })

  return (
    <figure>
      <div className="flex gap-2" role="img" aria-label={`Done on ${doneCount} of the last ${dayCount} days`}>
        <div className="grid grid-rows-7 gap-1 text-xs text-ink-muted" aria-hidden>
          {WEEKDAY_LABELS.map((label, index) => (
            <span key={index} className="flex h-3.5 items-center">
              {label}
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          {columns.map((column, week) => (
            <div key={week} className="grid grid-rows-7 gap-1">
              {column.map((cell) => (
                <span
                  key={cell.dayNumber}
                  title={cell.future ? undefined : `${describe(cell.dayNumber)}: ${cell.isDone ? 'done' : 'not done'}`}
                  style={cell.isDone ? { backgroundColor: colour } : undefined}
                  className={[
                    'size-3.5 rounded-[3px]',
                    cell.future ? 'bg-transparent' : cell.isDone ? '' : 'bg-sunken',
                    cell.isToday ? 'outline outline-1 outline-offset-1 outline-ink-muted' : '',
                  ].join(' ')}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <figcaption className="mt-3 text-sm text-ink-muted">
        Done on {doneCount} of the last {dayCount} days
      </figcaption>
    </figure>
  )
}
