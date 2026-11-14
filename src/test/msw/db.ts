import type { Habit, HabitHistoryRecord, JournalEntry } from '@/api/types'

/**
 * The fake backend's data. Tests change it directly (db.journals = []) to set up a scenario;
 * it is reset to these defaults after every test.
 */
export interface Db {
  journals: JournalEntry[]
  habits: Habit[]
  history: Record<string, HabitHistoryRecord[]>
  prompts: string[]
  tip: string
  feedback: string
}

function defaults(): Db {
  return {
    journals: [
      {
        id: 'j1',
        title: 'A slow start',
        content: 'I kept putting off the report today. Every time I sat down I found something else to do.',
        llmResponse: null,
        createdAt: '2026-11-12T08:15:00.123456',
      },
      {
        id: 'j2',
        title: 'Good run',
        content: 'Ran 5k before work and felt clear-headed all morning.',
        llmResponse: 'Notice how the run changed your morning. **Try pairing it** with your hardest task.',
        createdAt: '2026-11-10T19:40:00',
      },
      {
        id: 'j3',
        title: 'October thoughts',
        content: 'Looking back at the month, the evenings were the hardest part.',
        llmResponse: null,
        createdAt: '2026-10-28T21:05:00',
      },
    ],
    habits: [],
    history: {},
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
