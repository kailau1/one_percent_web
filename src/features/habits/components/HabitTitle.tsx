import { cn } from '@/lib/cn'
import { habitClause, habitTitle, type HabitTitleFields } from '../habit'

interface HabitTitleProps {
  habit: HabitTitleFields
  /** Shown dimmed (e.g. done today): the lead words dim with the rest instead of staying bright. */
  muted?: boolean
}

/**
 * A habit's title as shown on screen. Same text as `habitTitle()` (use that for labels), but in
 * trigger → action habits "When I" and "I will" are a little bolder (and, in dark mode, whiter),
 * so the two halves stand out.
 */
export function HabitTitle({ habit, muted = false }: HabitTitleProps) {
  if (habit.habitType !== 'trigger-action') return <>{habitTitle(habit)}</>
  const lead = cn('font-semibold', !muted && 'text-ink-strong')
  return (
    <>
      <span className={lead}>When I</span> {habitClause(habit.trigger)},{' '}
      <span className={lead}>I will</span> {habitClause(habit.action)}
    </>
  )
}
