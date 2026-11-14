import type { Habit } from '@/api/types'

/** The pastel colours a habit can have (the same set as the mobile app). */
export const HABIT_COLOURS = [
  { value: '#A7C7E7', name: 'Blue' },
  { value: '#B4E197', name: 'Green' },
  { value: '#F8C8DC', name: 'Pink' },
  { value: '#D6A4E7', name: 'Purple' },
  { value: '#FDFD96', name: 'Yellow' },
  { value: '#FFD1A9', name: 'Peach' },
  { value: '#AAF0D1', name: 'Mint' },
  { value: '#E3D4FC', name: 'Lavender' },
  { value: '#FCA3B7', name: 'Rose' },
  { value: '#AEEDEE', name: 'Aqua' },
] as const

export const DEFAULT_COLOUR = HABIT_COLOURS[0].value

/** A habit in one line: its name, or "When I …, I will …" for trigger → action habits. */
export function habitTitle(habit: Pick<Habit, 'habitType' | 'habitName' | 'trigger' | 'action'>): string {
  if (habit.habitType === 'trigger-action') {
    return `When I ${habit.trigger?.trim() || '…'}, I will ${habit.action?.trim() || '…'}`
  }
  return habit.habitName?.trim() || 'Untitled habit'
}

/** Only accept a colour we can safely put in a style attribute. */
export function safeColour(colour: string | null | undefined): string {
  return colour && /^#[0-9a-f]{6}$/i.test(colour) ? colour : DEFAULT_COLOUR
}
