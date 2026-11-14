import type { Habit, HabitHistoryRecord } from '@/api/types'
import { toDayNumber } from '@/features/habits/streaks'
import { activeDays, compounded } from './activity'

const today = new Date(2026, 10, 14, 9, 0)
const record = (date: string, completed = true): HabitHistoryRecord => ({ habitId: 'h1', date, completed })
const habit = (completed: boolean): Habit => ({ id: 'h1', colour: '#A7C7E7', completed, habitType: 'standard' })

describe('activeDays', () => {
  it('counts days with a journal entry or a completed habit, once each', () => {
    const days = activeDays(
      ['2026-11-10', '2026-11-10', '2026-11-12'],
      [record('2026-11-12'), record('2026-11-13'), record('2026-11-09', false)],
      [],
      today,
    )

    expect([...days].sort()).toEqual(['2026-11-10', '2026-11-12', '2026-11-13'].map(toDayNumber).sort())
  })

  it("uses the live habit list for today, so a tick or un-tick shows immediately", () => {
    const stale = [record('2026-11-14')] // history still says done, but it was just un-ticked

    expect(activeDays([], stale, [habit(false)], today).has(toDayNumber(today))).toBe(false)
    expect(activeDays([], [], [habit(true)], today).has(toDayNumber(today))).toBe(true)
  })

  it('an entry written today counts even with no habits done', () => {
    expect(activeDays(['2026-11-14'], [], [habit(false)], today).has(toDayNumber(today))).toBe(true)
  })

})

describe('compounded', () => {
  it('is 1.01 to the power of the number of days', () => {
    expect(compounded(0)).toBe(1)
    expect(compounded(1)).toBeCloseTo(1.01)
    expect(compounded(365)).toBeCloseTo(37.78, 1)
  })
})
