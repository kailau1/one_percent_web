import { formatDay, formatLongDate, formatMonth, formatTime, parseLocalDateTime } from './dates'

describe('parseLocalDateTime', () => {
  it('reads a backend date-time as local time', () => {
    const date = parseLocalDateTime('2026-11-14T09:30:15')!
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()]).toEqual([
      2026, 10, 14, 9, 30, 15,
    ])
  })

  it('copes with Java-length fractions of a second', () => {
    expect(parseLocalDateTime('2026-11-14T09:30:15.123456789')!.getMinutes()).toBe(30)
  })

  it('reads a date with no time as the start of that day', () => {
    const date = parseLocalDateTime('2026-11-14')!
    expect([date.getDate(), date.getHours()]).toEqual([14, 0])
  })

  it('returns null for missing or unreadable values', () => {
    expect(parseLocalDateTime(null)).toBeNull()
    expect(parseLocalDateTime(undefined)).toBeNull()
    expect(parseLocalDateTime('')).toBeNull()
    expect(parseLocalDateTime('yesterday-ish')).toBeNull()
  })
})

describe('formatting', () => {
  const now = new Date(2026, 10, 14, 12, 0)

  it('names today and yesterday', () => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    expect(formatDay(new Date(2026, 10, 14, 8, 0), now)).toBe('Today')
    expect(formatDay(new Date(2026, 10, 13, 23, 0), now)).toBe('Yesterday')
    vi.useRealTimers()
  })

  it('shows the weekday for this year and the year for older dates', () => {
    expect(formatDay(new Date(2026, 9, 2), now)).toBe('Fri 2 Oct')
    expect(formatDay(new Date(2025, 11, 25), now)).toBe('25 Dec 2025')
  })

  it('formats long dates, months and times', () => {
    const date = new Date(2026, 10, 14, 9, 5)
    expect(formatLongDate(date)).toBe('Saturday 14 November 2026')
    expect(formatMonth(date)).toBe('November 2026')
    expect(formatTime(date)).toBe('9:05 am')
  })
})
