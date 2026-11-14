const MS_PER_DAY = 24 * 60 * 60 * 1000

export interface DayRecord {
  /** "YYYY-MM-DD" */
  date: string
  completed: boolean
}

/**
 * Converts a date to a whole "day number" so calendar days can be compared with simple
 * arithmetic, without timezone or daylight-saving surprises.
 *
 * - Strings like "2025-04-20" (what the API sends) are read as that calendar day. Note that
 *   `new Date("2025-04-20")` would parse as *UTC* midnight, which is an hour early during BST
 *   and the previous evening west of UTC: the source of real streak bugs in the mobile app.
 * - Date objects are read as the device's local calendar day.
 */
export function toDayNumber(date: string | Date): number {
  if (typeof date === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date)
    if (match) {
      return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / MS_PER_DAY
    }
    date = new Date(date)
  }
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY
}

/** The local calendar day as "YYYY-MM-DD", the format the API uses. */
export function toDayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** The set of distinct days on which the habit was completed. */
export function completedDays(history: DayRecord[]): Set<number> {
  return new Set(history.filter((record) => record.completed).map((record) => toDayNumber(record.date)))
}

/**
 * Number of consecutive days, ending today, on which the habit was completed.
 *
 * If today hasn't been completed *yet*, the streak still counts up to yesterday: it isn't
 * broken until the day is over. Duplicate records count once and input order doesn't matter.
 */
export function calculateCurrentStreak(history: DayRecord[], today: Date = new Date()): number {
  const days = completedDays(history)
  const todayNumber = toDayNumber(today)

  let cursor = days.has(todayNumber) ? todayNumber : todayNumber - 1
  let streak = 0
  while (days.has(cursor)) {
    streak++
    cursor--
  }
  return streak
}

/** The longest run of consecutive completed days anywhere in the history. */
export function calculateLongestStreak(history: DayRecord[]): number {
  const days = [...completedDays(history)].sort((a, b) => a - b)

  let longest = 0
  let current = 0
  for (let i = 0; i < days.length; i++) {
    current = i > 0 && days[i] === days[i - 1] + 1 ? current + 1 : 1
    longest = Math.max(longest, current)
  }
  return longest
}

/**
 * History with today's record replaced by what the habit list says right now, so a tick shows
 * in streaks immediately instead of after the history is fetched again.
 */
export function withToday<T extends DayRecord>(history: T[], completedToday: boolean, today: Date = new Date()): DayRecord[] {
  const todayKey = toDayKey(today)
  return [...history.filter((record) => record.date.slice(0, 10) !== todayKey), { date: todayKey, completed: completedToday }]
}
