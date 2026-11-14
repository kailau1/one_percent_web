import { ChevronRight, Flame } from 'lucide-react'
import type { Habit } from '@/api/types'
import { cn } from '@/lib/cn'
import { habitTitle, safeColour } from '../habit'
import { HabitToggle } from './HabitToggle'

interface HabitRowProps {
  habit: Habit
  /** Consecutive days up to today (or yesterday, if today isn't done yet). */
  streak: number
  onToggle: (completed: boolean) => void
  onOpen: () => void
}

/** One habit: tick it off on the left, open its details on the right. */
export function HabitRow({ habit, streak, onToggle, onOpen }: HabitRowProps) {
  const title = habitTitle(habit)

  return (
    <li className="flex items-center gap-4 border-b border-line py-3.5 last:border-b-0">
      <HabitToggle checked={habit.completed} onChange={onToggle} label={title} colour={safeColour(habit.colour)} />

      <button type="button" onClick={onOpen} className="group flex min-w-0 flex-1 items-center gap-3 rounded-control text-left" aria-label={`${title}: details`}>
        <span className="min-w-0 flex-1">
          <span className={cn('block truncate font-serif text-lg', habit.completed && 'text-ink-muted')}>{title}</span>
          {habit.habitType === 'standard' && habit.description && (
            <span className="block truncate text-sm text-ink-muted">{habit.description}</span>
          )}
        </span>

        {streak > 0 && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-sunrise-wash px-2.5 py-1 text-sm font-medium" title="Current streak">
            <Flame aria-hidden className="size-3.5 text-sunrise" />
            {streak} {streak === 1 ? 'day' : 'days'}
          </span>
        )}
        <ChevronRight aria-hidden className="size-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5" />
      </button>
    </li>
  )
}
