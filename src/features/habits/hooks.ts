import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api/client'
import type { Habit } from '@/api/types'
import {
  createHabit,
  deleteHabit,
  getHabitHistory,
  getRecentHistory,
  listHabits,
  setCompletedToday,
  updateHabit,
  type HabitInput,
} from './api'

export const habitKeys = {
  all: ['habits'] as const,
  history: ['habit-history'] as const,
  recentHistory: ['habit-history', 'recent'] as const,
  historyOf: (id: string) => ['habit-history', id] as const,
}

export function useHabits() {
  return useQuery({ queryKey: habitKeys.all, queryFn: listHabits })
}

/** All habits' history for the last year: used for streaks on the list and the year view. */
export function useRecentHistory() {
  return useQuery({ queryKey: habitKeys.recentHistory, queryFn: getRecentHistory })
}

export function useHabitHistory(id: string | undefined) {
  return useQuery({ queryKey: habitKeys.historyOf(id ?? ''), queryFn: () => getHabitHistory(id!), enabled: Boolean(id) })
}

/**
 * Ticks or un-ticks a habit for today. Optimistic: the tick shows immediately; if the server
 * call fails it is rolled back with a message, so the screen never shows something unsaved.
 */
export function useToggleHabit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) => setCompletedToday(id, completed),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: habitKeys.all })
      const previous = queryClient.getQueryData<Habit[]>(habitKeys.all)
      queryClient.setQueryData<Habit[]>(habitKeys.all, (habits = []) =>
        habits.map((habit) => (habit.id === id ? { ...habit, completed } : habit)),
      )
      return { previous }
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(habitKeys.all, context.previous)
      toast.error(getErrorMessage(error))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all })
      queryClient.invalidateQueries({ queryKey: habitKeys.history })
    },
  })
}

/** Creates (no id) or updates (id) a habit. */
export function useSaveHabit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: HabitInput }) => (id ? updateHabit(id, input) : createHabit(input)),
    onSuccess: (saved) => {
      queryClient.setQueryData<Habit[]>(habitKeys.all, (habits = []) =>
        habits.some((h) => h.id === saved.id) ? habits.map((h) => (h.id === saved.id ? saved : h)) : [...habits, saved],
      )
    },
  })
}

export function useDeleteHabit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteHabit,
    onSuccess: (_, id) => {
      queryClient.setQueryData<Habit[]>(habitKeys.all, (habits = []) => habits.filter((h) => h.id !== id))
      queryClient.invalidateQueries({ queryKey: habitKeys.history })
    },
  })
}
