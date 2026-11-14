import { format, isSameYear, isToday, isYesterday } from 'date-fns'

/**
 * Parses the backend's date-times, e.g. "2026-11-14T09:30:00.123456". They carry no timezone
 * (Java LocalDateTime) and can have more fraction digits than JavaScript's Date officially
 * accepts, so the parts are read by hand and treated as local time. Returns null if unreadable.
 */
export function parseLocalDateTime(value: string | null | undefined): Date | null {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(value)
  if (!match) return null
  const [, year, month, day, hour = '0', minute = '0', second = '0'] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second))
  return Number.isNaN(date.getTime()) ? null : date
}

/** "Today", "Yesterday", "Fri 14 Nov" or "14 Nov 2025" for older years. */
export function formatDay(date: Date, now: Date = new Date()): string {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, isSameYear(date, now) ? 'EEE d MMM' : 'd MMM yyyy')
}

/** "Friday 14 November 2026" */
export function formatLongDate(date: Date): string {
  return format(date, 'EEEE d MMMM yyyy')
}

/** "November 2026": the heading entries are grouped under. */
export function formatMonth(date: Date): string {
  return format(date, 'MMMM yyyy')
}

/** "9:30 am" */
export function formatTime(date: Date): string {
  return format(date, 'h:mm a').toLowerCase()
}
