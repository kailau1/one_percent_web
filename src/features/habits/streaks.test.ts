import {
  calculateCurrentStreak,
  calculateLongestStreak,
  toDayKey,
  toDayNumber,
  withToday,
  type DayRecord,
} from './streaks'

// Tests run with TZ=Europe/London (see vite.config.ts) so the BST cases are meaningful.

/** Formats a local date the way the API does: "YYYY-MM-DD". */
function ymd(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Midday on 20 April 2025 (BST). Used as "today" unless a test says otherwise. */
const TODAY = new Date(2025, 3, 20, 12, 0, 0)

function daysAgo(n: number, from: Date = TODAY): string {
  const d = new Date(from)
  d.setDate(d.getDate() - n)
  return ymd(d)
}

const done = (date: string): DayRecord => ({ date, completed: true })
const missed = (date: string): DayRecord => ({ date, completed: false })

describe('toDayNumber', () => {
  it('treats an API date string as that calendar day, not UTC midnight', () => {
    expect(toDayNumber('2025-04-20')).toBe(toDayNumber(new Date(2025, 3, 20, 0, 30)))
    expect(toDayNumber('2025-04-20')).toBe(toDayNumber(new Date(2025, 3, 20, 23, 59)))
  })

  it('accepts full ISO timestamps by their date part', () => {
    expect(toDayNumber('2025-04-20T08:15:00')).toBe(toDayNumber('2025-04-20'))
  })

  it('gives consecutive days consecutive numbers across the clocks changing', () => {
    // BST started on 30 March 2025, a 23-hour day
    expect(toDayNumber('2025-03-31') - toDayNumber('2025-03-30')).toBe(1)
    expect(toDayNumber('2025-03-30') - toDayNumber('2025-03-29')).toBe(1)
  })
})

describe('calculateCurrentStreak', () => {
  it('is 0 with no history', () => {
    expect(calculateCurrentStreak([], TODAY)).toBe(0)
  })

  it('is 1 when only today is completed', () => {
    expect(calculateCurrentStreak([done(daysAgo(0))], TODAY)).toBe(1)
  })

  it('counts consecutive completed days ending today', () => {
    const history = [done(daysAgo(0)), done(daysAgo(1)), done(daysAgo(2))]
    expect(calculateCurrentStreak(history, TODAY)).toBe(3)
  })

  it("keeps yesterday's streak alive when today isn't done yet", () => {
    const history = [done(daysAgo(1)), done(daysAgo(2)), done(daysAgo(3))]
    expect(calculateCurrentStreak(history, TODAY)).toBe(3)
  })

  it('keeps the streak alive when today has an un-ticked record', () => {
    // un-completing a habit creates a { completed: false } record for today
    const history = [missed(daysAgo(0)), done(daysAgo(1)), done(daysAgo(2))]
    expect(calculateCurrentStreak(history, TODAY)).toBe(2)
  })

  it('is 0 once a full day has been missed', () => {
    expect(calculateCurrentStreak([done(daysAgo(2)), done(daysAgo(3))], TODAY)).toBe(0)
  })

  it('stops at the first gap', () => {
    const history = [done(daysAgo(0)), done(daysAgo(1)), done(daysAgo(3)), done(daysAgo(4))]
    expect(calculateCurrentStreak(history, TODAY)).toBe(2)
  })

  it('stops at a day recorded as not completed', () => {
    const history = [done(daysAgo(0)), missed(daysAgo(1)), done(daysAgo(2))]
    expect(calculateCurrentStreak(history, TODAY)).toBe(1)
  })

  it('counts duplicate records for the same day once', () => {
    const history = [done(daysAgo(0)), done(daysAgo(0)), done(daysAgo(1)), done(daysAgo(2))]
    expect(calculateCurrentStreak(history, TODAY)).toBe(3)
  })

  it("doesn't depend on the order of the history", () => {
    const history = [done(daysAgo(2)), done(daysAgo(0)), done(daysAgo(1))]
    expect(calculateCurrentStreak(history, TODAY)).toBe(3)
  })

  it('ignores dates in the future', () => {
    const tomorrow = daysAgo(-1)
    expect(calculateCurrentStreak([done(tomorrow), done(daysAgo(0))], TODAY)).toBe(1)
  })

  it('does not mutate the input array', () => {
    const history = [done(daysAgo(2)), done(daysAgo(0)), done(daysAgo(1))]
    const copy = [...history]
    calculateCurrentStreak(history, TODAY)
    expect(history).toEqual(copy)
  })

  it("counts today's completion just after midnight during BST", () => {
    // Regression: "2025-04-20" used to parse as 01:00 BST, so at 00:30 it looked like the future.
    const justAfterMidnight = new Date(2025, 3, 20, 0, 30)
    const history = [done('2025-04-20'), done('2025-04-19')]
    expect(calculateCurrentStreak(history, justAfterMidnight)).toBe(2)
  })

  it("counts today's completion just before midnight", () => {
    const lateEvening = new Date(2025, 3, 20, 23, 59)
    expect(calculateCurrentStreak([done('2025-04-20')], lateEvening)).toBe(1)
  })

  it('runs across the clocks going forward', () => {
    const april1 = new Date(2025, 3, 1, 9, 0)
    const history = ['2025-03-28', '2025-03-29', '2025-03-30', '2025-03-31', '2025-04-01'].map(done)
    expect(calculateCurrentStreak(history, april1)).toBe(5)
  })

  it('uses the real current date by default', () => {
    expect(calculateCurrentStreak([done(ymd(new Date()))])).toBe(1)
  })
})

describe('calculateLongestStreak', () => {
  it('is 0 with no history', () => {
    expect(calculateLongestStreak([])).toBe(0)
  })

  it('is 0 when nothing was ever completed', () => {
    expect(calculateLongestStreak([missed('2025-04-01'), missed('2025-04-02')])).toBe(0)
  })

  it('is 1 for a single completed day', () => {
    expect(calculateLongestStreak([done('2025-04-01')])).toBe(1)
  })

  it('finds the longest of several runs', () => {
    const history = [
      ...['2025-04-01', '2025-04-02', '2025-04-03'].map(done),
      ...['2025-04-10', '2025-04-11', '2025-04-12', '2025-04-13', '2025-04-14'].map(done),
      done('2025-04-16'),
    ]
    expect(calculateLongestStreak(history)).toBe(5)
  })

  it('breaks a run on a day recorded as not completed', () => {
    const history = [
      done('2025-04-01'),
      done('2025-04-02'),
      missed('2025-04-03'),
      done('2025-04-04'),
    ]
    expect(calculateLongestStreak(history)).toBe(2)
  })

  it('counts duplicate records for the same day once', () => {
    const history = [done('2025-04-01'), done('2025-04-01'), done('2025-04-02')]
    expect(calculateLongestStreak(history)).toBe(2)
  })

  it("doesn't depend on order", () => {
    const history = ['2025-04-03', '2025-04-01', '2025-04-02'].map(done)
    expect(calculateLongestStreak(history)).toBe(3)
  })

  it('spans month boundaries and the clocks changing', () => {
    const history = ['2025-03-29', '2025-03-30', '2025-03-31', '2025-04-01'].map(done)
    expect(calculateLongestStreak(history)).toBe(4)
  })

  it('is at least the current streak', () => {
    const history = [done(daysAgo(0)), done(daysAgo(1)), done(daysAgo(5))]
    expect(calculateLongestStreak(history)).toBeGreaterThanOrEqual(
      calculateCurrentStreak(history, TODAY),
    )
  })
})

describe('toDayKey', () => {
  it('formats the local calendar day the way the API does', () => {
    expect(toDayKey(new Date(2025, 3, 5, 23, 59))).toBe('2025-04-05')
    expect(toDayKey(new Date(2025, 11, 31, 0, 0))).toBe('2025-12-31')
  })
})

describe('withToday', () => {
  it("overrides today's record with the live value", () => {
    const history = [done(daysAgo(0)), done(daysAgo(1))]

    expect(calculateCurrentStreak(withToday(history, false, TODAY), TODAY)).toBe(1) // un-ticked: streak to yesterday
    expect(calculateCurrentStreak(withToday([done(daysAgo(1))], true, TODAY), TODAY)).toBe(2) // just ticked
  })

  it('leaves other days alone', () => {
    const history = [missed(daysAgo(1)), done(daysAgo(2))]

    expect(withToday(history, true, TODAY)).toEqual([
      ...history,
      { date: daysAgo(0), completed: true },
    ])
  })
})
