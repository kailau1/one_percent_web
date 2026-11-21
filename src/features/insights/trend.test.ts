import { describeTrend, monthName, trendLabel } from './trend'

const months = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11']

describe('monthName', () => {
  it('names the month without time zone surprises', () => {
    expect(monthName('2026-10')).toBe('October')
    expect(monthName('2026-01', 'short')).toBe('Jan')
  })
})

describe('describeTrend', () => {
  it('names the busiest month', () => {
    expect(describeTrend(months, [0, 1, 0, 0, 4, 1])).toBe('Most in October: 4 entries.')
  })
  it('says when there is no single busiest month', () => {
    expect(describeTrend(months, [1, 0, 1, 0, 0, 0])).toBe('2 entries in the last 6 months, spread out.')
  })
  it('handles a theme with nothing recent', () => {
    expect(describeTrend(months, [0, 0, 0, 0, 0, 0])).toBe('None in the last 6 months.')
  })
})

describe('trendLabel', () => {
  it('says "More this month" only for a clear rise', () => {
    expect(trendLabel([0, 1, 0, 1, 1, 3], false)).toBe('More this month')
    expect(trendLabel([0, 0, 0, 0, 0, 1], false)).toBeNull() // one entry is not a trend
    expect(trendLabel([0, 0, 2, 0, 0, 2], false)).toBeNull() // not more than before
  })
  it('says "Quieter lately" for a main theme absent for two months', () => {
    expect(trendLabel([2, 3, 1, 1, 0, 0], true)).toBe('Quieter lately')
    expect(trendLabel([2, 3, 1, 1, 0, 0], false)).toBeNull() // only for main themes
    expect(trendLabel([0, 0, 0, 0, 0, 0], true)).toBeNull() // never came up in the window
  })
})
