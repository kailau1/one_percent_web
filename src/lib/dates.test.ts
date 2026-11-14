import { browserTimeZone, formatDay, formatLongDate, formatMonth, formatTime, parseDateTime } from './dates'

// Tests run in Europe/London (see vite.config.ts): UTC+0 in winter, UTC+1 in summer.
const parts = (date: Date) => [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()]

describe('parseDateTime', () => {
  it('reads a UTC timestamp as that moment, shown in local time', () => {
    expect(parseDateTime('2026-11-14T09:30:15.123Z')!.toISOString()).toBe('2026-11-14T09:30:15.123Z')
    // summer: 09:30 UTC is 10:30 in London
    expect(parts(parseDateTime('2026-07-01T09:30:00Z')!)).toEqual([2026, 6, 1, 10, 30, 0])
  })

  it('applies an explicit offset', () => {
    expect(parseDateTime('2026-11-14T09:30:00-05:00')!.toISOString()).toBe('2026-11-14T14:30:00.000Z')
    expect(parseDateTime('2026-11-14T09:30:00+0530')!.toISOString()).toBe('2026-11-14T04:00:00.000Z')
    expect(parseDateTime('2026-11-14T09:30:00+05')!.toISOString()).toBe('2026-11-14T04:30:00.000Z')
  })

  it('puts a late-evening UTC entry on the right local day', () => {
    // 23:30 UTC in summer is already the next day in London
    expect(parts(parseDateTime('2026-07-01T23:30:00Z')!).slice(0, 3)).toEqual([2026, 6, 2])
  })

  it('still reads an older zone-less timestamp as local time', () => {
    expect(parts(parseDateTime('2026-11-14T09:30:15')!)).toEqual([2026, 10, 14, 9, 30, 15])
  })

  it('copes with Java-length fractions of a second', () => {
    expect(parseDateTime('2026-11-14T09:30:15.123456789')!.getMilliseconds()).toBe(123)
    expect(parseDateTime('2026-11-14T09:30:15.123456789Z')!.toISOString()).toBe('2026-11-14T09:30:15.123Z')
  })

  it('reads a date with no time as the start of that day', () => {
    const date = parseDateTime('2026-11-14')!
    expect([date.getDate(), date.getHours()]).toEqual([14, 0])
  })

  it('returns null for missing or unreadable values', () => {
    expect(parseDateTime(null)).toBeNull()
    expect(parseDateTime(undefined)).toBeNull()
    expect(parseDateTime('')).toBeNull()
    expect(parseDateTime('yesterday-ish')).toBeNull()
    // an offset it can't read is an error, not something to quietly read as local time
    expect(parseDateTime('2026-11-14T09:30:00+05:30:00')).toBeNull()
    expect(parseDateTime('2026-11-14T09:30:00 EST')).toBeNull()
  })
})

describe('browserTimeZone', () => {
  it('reports the IANA zone', () => {
    expect(browserTimeZone()).toBe('Europe/London')
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
