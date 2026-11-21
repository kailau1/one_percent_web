import type { AiContext, Habit, HabitHistoryRecord, JournalEntry, ThemeInsights, UserProfile, WeeklyReflection } from '@/api/types'

/**
 * The fake backend's data. Tests change it directly (db.journals = []) to set up a scenario;
 * it is reset to these defaults after every test.
 */
export interface Db {
  /** GET /api/users/me. Its zone matches the test browser's, so nothing syncs unless a test changes it. */
  profile: UserProfile
  journals: JournalEntry[]
  insights: ThemeInsights
  habits: Habit[]
  history: HabitHistoryRecord[]
  /** "Today" as the fake server sees it: the real current day, so streaks line up with the app. */
  today: string
  prompts: string[]
  tip: string
  feedback: string
  /** GET /api/users/me/ai-context, minus the preview (the handler renders it like the backend). */
  aiContext: Omit<AiContext, 'preview'>
  /** GET /api/reflections/latest */
  latestReflection: WeeklyReflection
  /** Weeks already written, newest first (GET /api/reflections and /api/reflections/:weekStart). */
  reflections: WeeklyReflection[]
}

/** "YYYY-MM-DD" for the local day `daysAgo` days before today. */
export function dayKey(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const lastWeek: WeeklyReflection = {
  status: 'ready',
  weekStart: '2026-11-09',
  weekEnd: '2026-11-15',
  entryCount: 4,
  daysWritten: 3,
  themes: [
    { name: 'procrastination', thisWeek: 3, previousFourWeeks: 2 },
    { name: 'self-doubt', thisWeek: 1, previousFourWeeks: 0 },
  ],
  habits: [{ name: 'Read 10 pages', colour: '#A7C7E7', daysDone: 3 }],
  opening: 'A week of starting late and finishing anyway. The report kept coming back.',
  quotes: [{ entryId: 'j1', entryTitle: 'A slow start', text: 'I kept putting off the report today' }],
  question: 'What made the report feel bigger than it was?',
  createdAt: '2026-11-16T08:00:00Z',
}

function defaults(): Db {
  return {
    profile: { id: 'u1', email: 'kai@example.com', firstName: 'Kai', lastName: 'Lau', timeZone: 'Europe/London' },
    insights: {
      totalEntries: 3,
      analysedEntries: 2,
      themes: [
        {
          name: 'procrastination',
          entryCount: 2,
          recentEntries: [
            { id: 'j1', title: 'A slow start', createdAt: '2026-11-12T08:15:00.123Z' },
            { id: 'j2', title: 'Good run', createdAt: '2026-11-10T19:40:00Z' },
          ],
          monthlyCounts: [0, 0, 0, 0, 0, 2],
        },
        {
          name: 'self-doubt',
          entryCount: 1,
          recentEntries: [{ id: 'j1', title: 'A slow start', createdAt: '2026-11-12T08:15:00.123Z' }],
          monthlyCounts: [0, 0, 0, 0, 0, 1],
        },
      ],
      months: ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'],
      entriesPerMonth: [0, 0, 0, 0, 0, 2],
    },
    journals: [
      {
        id: 'j1',
        title: 'A slow start',
        content: 'I kept putting off the report today. Every time I sat down I found something else to do.',
        llmResponse: null,
        createdAt: '2026-11-12T08:15:00.123Z',
        themes: ['procrastination', 'self-doubt'],
      },
      {
        id: 'j2',
        title: 'Good run',
        content: 'Ran 5k before work and felt clear-headed all morning.',
        llmResponse: 'Notice how the run changed your morning. **Try pairing it** with your hardest task.',
        createdAt: '2026-11-10T19:40:00Z',
        themes: [],
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
    aiContext: {
      habits: ['Read 10 pages'],
      themes: ['procrastination', 'self-doubt'],
      facts: [{ id: 'f1', text: 'I work night shifts', createdAt: '2026-11-01T09:00:00Z' }],
      settings: { useHabits: true, useThemes: true, useFacts: true, usePastAdvice: true },
      maxFacts: 20,
      maxFactLength: 200,
    },
    latestReflection: lastWeek,
    reflections: [lastWeek],
  }
}

export const db: Db = defaults()

export function resetDb(): void {
  Object.assign(db, defaults())
}

let nextId = 100
export const newId = (prefix: string) => `${prefix}${nextId++}`
