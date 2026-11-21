/**
 * Shapes the backend sends and accepts, mirroring the DTOs in one_percent_spring.
 * When a backend DTO changes, change it here and in src/test/msw/handlers.ts together.
 */

export interface JournalEntry {
  id: string
  title: string
  content: string
  /** AI feedback (markdown), if any has been generated. */
  llmResponse?: string | null
  /** When it was written: a UTC timestamp, e.g. "2026-11-14T09:30:00.123Z". Parse with parseDateTime. */
  createdAt: string
  /** What the entry is about: automatic tags with the user's corrections, strongest first. Read-only. */
  themes?: string[]
  /** Every theme an entry can have (single-entry responses only), for the "add theme" picker. */
  themeChoices?: string[]
}

/** One page of a longer list (PageDTO). `page` counts from 0. */
export interface Page<T> {
  items: T[]
  page: number
  size: number
  totalItems: number
  totalPages: number
  hasNext: boolean
}

/** GET /api/insights/themes (ThemeInsightsDTO): what the user's journal keeps coming back to. */
export interface ThemeInsights {
  totalEntries: number
  /** Entries that could be matched to themes; the rest were saved while AI analysis was unavailable. */
  analysedEntries: number
  /** Most common first. An analysed entry has the themes it's clearly about: none, one or a few. */
  themes: {
    name: string
    entryCount: number
    /** Up to three, newest first. */
    recentEntries: { id: string; title: string | null; createdAt: string }[]
    /** Entries about this theme in each of `months` (same order). */
    monthlyCounts?: number[]
  }[]
  /** The last six calendar months in the user's time zone, oldest first, e.g. "2026-11". */
  months?: string[]
  /** Analysed entries written in each of `months`. */
  entriesPerMonth?: number[]
}

export type HabitType = 'standard' | 'trigger-action'

export interface Habit {
  id: string
  habitName?: string | null
  description?: string | null
  colour: string
  /** Whether it has been completed today (derived from today's history on the server). */
  completed: boolean
  habitType: HabitType
  trigger?: string | null
  action?: string | null
  createdAt?: string | null
  lastUpdated?: string | null
}

export interface HabitHistoryRecord {
  habitId: string
  /** Calendar day "YYYY-MM-DD". Parse as a day, never with new Date(string). */
  date: string
  completed: boolean
}

export interface AiResponse {
  response: string
}

export interface AuthResponse {
  token: string
}

/** GET /api/users/me (UserDTO). */
export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  /** IANA time zone such as "Europe/London": where the user's days start. Null until first set. */
  timeZone: string | null
}

/** The logged-in user, read from the JWT's claims. */
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
}

/** Something the user has told One Percent about themselves, for the AI to keep in mind. */
export interface AiFact {
  id: string
  text: string
  createdAt: string
}

/** Which kinds of context the AI is given. */
export interface AiContextSettings {
  useHabits: boolean
  useThemes: boolean
  useFacts: boolean
  usePastAdvice: boolean
}

/** GET /api/users/me/ai-context: everything the AI could be told about the user, and what it is told. */
export interface AiContext {
  /** Habits ticked or changed in the last 7 days, as the AI sees them. */
  habits: string[]
  themes: string[]
  /** Oldest first. */
  facts: AiFact[]
  settings: AiContextSettings
  /** The context text exactly as it is sent with feedback and prompt requests. */
  preview: string
  maxFacts: number
  maxFactLength: number
}

/**
 * A finished week read back to the user (GET /api/reflections/…). With status "notEnoughEntries"
 * only weekStart, weekEnd and entryCount are present.
 */
export interface WeeklyReflection {
  status: 'ready' | 'notEnoughEntries'
  /** Monday, "YYYY-MM-DD", in the user's time zone. */
  weekStart: string
  /** The Sunday. */
  weekEnd: string
  entryCount: number
  daysWritten?: number
  /** Most common first: entries this week, and in the four weeks before. */
  themes?: { name: string; thisWeek: number; previousFourWeeks: number }[]
  /** Days ticked out of the week's 7. */
  habits?: { name: string; colour: string; daysDone: number }[]
  opening?: string
  /** The user's own words, checked by the server to appear in the entry. */
  quotes?: { entryId: string; entryTitle: string | null; text: string }[]
  question?: string
  createdAt?: string
}
