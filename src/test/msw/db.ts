import type { Habit, HabitHistoryRecord, JournalEntry, UserProfile } from '@/api/types'

/**
 * The fake backend's data. Tests change it directly (db.journals = []) to set up a scenario;
 * it is reset to these defaults after every test.
 */
export interface Db {
  /** GET /api/users/me. Its zone matches the test browser's, so nothing syncs unless a test changes it. */
  profile: UserProfile
  journals: JournalEntry[]
  habits: Habit[]
  history: HabitHistoryRecord[]
  /** "Today" as the fake server sees it: the real current day, so streaks line up with the app. */
  today: string
  prompts: string[]
  tip: string
  feedback: string
}

/** "YYYY-MM-DD" for the local day `daysAgo` days before today. */
export function dayKey(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function defaults(): Db {
  return {
    profile: { id: 'u1', email: 'kai@example.com', firstName: 'Kai', lastName: 'Lau', timeZone: 'Europe/London' },
    journals: [
      {
        id: 'j1',
        title: 'A slow start',
        content: 'I kept putting off the report today. Every time I sat down I found something else to do.',
        llmResponse: null,
        createdAt: '2026-11-12T08:15:00.123Z',
      },
      {
        id: 'j2',
        title: 'Good run',
        content: 'Ran 5k before work and felt clear-headed all morning.',
        llmResponse: 'Notice how the run changed your morning. **Try pairing it** with your hardest task.',
        createdAt: '2026-11-10T19:40:00Z',
      },
      {
        id: 'j3',
        title: 'October thoughts',
        content: 'Looking back at the month, the evenings were the hardest part.',
        llmResponse: null,
        createdAt: '2026-10-28T21:05:00Z',
      },
    ],
    habits: [
      { id: 'h1', habitName: 'Read 10 pages', description: 'Before bed', colour: '#A7C7E7', completed: false, habitType: 'standard' },
      { id: 'h2', habitName: 'Morning run', description: '', colour: '#B4E197', completed: true, habitType: 'standard' },
      {
        id: 'h3',
        habitName: '',
        description: '',
        colour: '#F8C8DC',
        completed: false,
        habitType: 'trigger-action',
        trigger: 'pour my coffee',
        action: 'write one line',
      },
    ],
    // h1: done the last three days but not yet today (streak 3). h2: done today and yesterday (streak 2).
    history: [
      { habitId: 'h1', date: dayKey(1), completed: true },
      { habitId: 'h1', date: dayKey(2), completed: true },
      { habitId: 'h1', date: dayKey(3), completed: true },
      { habitId: 'h1', date: dayKey(6), completed: true },
      { habitId: 'h2', date: dayKey(0), completed: true },
      { habitId: 'h2', date: dayKey(1), completed: true },
    ],
    today: dayKey(0),
    prompts: ['What drained you today?', 'What are you proud of this week?', 'What would make tomorrow easier?'],
    tip: 'Leave your journal on your pillow so you see it before bed.',
    feedback: 'It sounds like starting was the hard part. Try the **two-minute rule**: commit to just two minutes.',
  }
}

export const db: Db = defaults()

export function resetDb(): void {
  Object.assign(db, defaults())
}

let nextId = 100
export const newId = (prefix: string) => `${prefix}${nextId++}`
