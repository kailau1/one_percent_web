import { addDays, format, startOfWeek } from 'date-fns'

/** "2026-11-09" as a local calendar day (never through Date's UTC parsing). */
export function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const dayKey = (date: Date) => format(date, 'yyyy-MM-dd')

/** The Monday of the last finished week, on this device's calendar, e.g. "2026-11-09". */
export function lastWeekStart(now: Date = new Date()): string {
  return dayKey(addDays(startOfWeek(now, { weekStartsOn: 1 }), -7))
}

/** "9–15 November", "30 November – 6 December", "29 December 2025 – 4 January 2026". */
export function formatWeekRange(weekStart: string, weekEnd: string): string {
  const start = parseDay(weekStart)
  const end = parseDay(weekEnd)
  if (start.getFullYear() !== end.getFullYear())
    return `${format(start, 'd MMMM yyyy')} – ${format(end, 'd MMMM yyyy')}`
  if (start.getMonth() !== end.getMonth())
    return `${format(start, 'd MMMM')} – ${format(end, 'd MMMM')}`
  return `${format(start, 'd')}–${format(end, 'd MMMM')}`
}

export const entries = (n: number) => `${n} ${n === 1 ? 'entry' : 'entries'}`

/** How a theme's week compares with the four before: "new this month", "about 1 a week before". */
export function themeComparison(thisWeek: number, previousFourWeeks: number): string {
  if (previousFourWeeks === 0) return 'not in the four weeks before'
  const perWeek = previousFourWeeks / 4
  if (thisWeek > perWeek * 2 && thisWeek - perWeek >= 2)
    return `more than usual (${entries(previousFourWeeks)} in the four weeks before)`
  return `${entries(previousFourWeeks)} in the four weeks before`
}
