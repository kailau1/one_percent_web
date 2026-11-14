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
  /** ISO date-time without a timezone, e.g. "2026-11-14T09:30:00.123". */
  createdAt: string
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

/** The logged-in user, read from the JWT's claims. */
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
}
