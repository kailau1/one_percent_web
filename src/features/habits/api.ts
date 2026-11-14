import { apiRequest } from '@/api/client'
import type { Habit, HabitHistoryRecord, HabitType } from '@/api/types'

export interface HabitInput {
  habitType: HabitType
  /** Standard habits: what the habit is. */
  habitName?: string
  description?: string
  /** Trigger → action habits: "When I <trigger>, I will <action>". */
  trigger?: string
  action?: string
  colour: string
}

export const listHabits = () => apiRequest<Habit[]>('/api/habits/me').then((habits) => habits ?? [])

export const createHabit = (input: HabitInput) => apiRequest<Habit>('/api/habits/create', { method: 'POST', body: input })

export const updateHabit = (id: string, input: HabitInput) =>
  apiRequest<Habit>('/api/habits/update', { method: 'PUT', body: { id, ...input } })

export const deleteHabit = (id: string) => apiRequest<void>(`/api/habits/delete/${id}`, { method: 'DELETE' })

/** Marks the habit done (or not done) for today. */
export const setCompletedToday = (id: string, completed: boolean) =>
  apiRequest<HabitHistoryRecord>(`/api/habit-history/${completed ? 'complete' : 'uncomplete'}/${id}`, { method: 'POST' })

/** One habit's full history. */
export const getHabitHistory = (id: string) =>
  apiRequest<HabitHistoryRecord[]>(`/api/habit-history/${id}`).then((records) => records ?? [])

/** Every habit's history for the last year, in one request. */
export const getRecentHistory = () =>
  apiRequest<HabitHistoryRecord[]>('/api/habit-history').then((records) => records ?? [])
