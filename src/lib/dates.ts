import { format, isSameYear, isToday, isYesterday } from 'date-fns'

/**
 * Parses the backend's timestamps. The server sends UTC moments, e.g. "2026-11-14T09:30:00.123Z",
 * shown here in the browser's own time zone. Older servers sent a zone-less local time
 * ("2026-11-14T09:30:00.123456"), which is still read as local time. The parts are read by hand
 * because Java can send more fraction digits than JavaScript's Date officially accepts.
 * Returns null if unreadable.
 */
export function parseDateTime(value: string | null | undefined): Date | null {
  if (!value) return null
  const match =
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?)?(Z|[+-]\d{2}(?::?\d{2})?)?$/i.exec(value.trim())
  if (!match) return null
  const [, year, month, day, hour = '0', minute = '0', second = '0', fraction = '', zone] = match
  const parts = [Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second), Number(fraction.padEnd(3, '0').slice(0, 3))] as const
  let date: Date
  if (zone) {
    const offset = /^([+-])(\d{2}):?(\d{2})?$/.exec(zone)
    const offsetMinutes = offset ? (offset[1] === '-' ? -1 : 1) * (Number(offset[2]) * 60 + Number(offset[3] ?? 0)) : 0
    date = new Date(Date.UTC(...parts) - offsetMinutes * 60_000)
  } else {
    date = new Date(...parts)
  }
  return Number.isNaN(date.getTime()) ? null : date
}

/** The browser's IANA time zone, e.g. "Europe/London", or null if it can't say. */
export function browserTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null
  } catch {
    return null
  }
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
