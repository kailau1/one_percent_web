import { habitClause, habitTitle, type HabitTitleFields } from '../habit'

/**
 * A habit's title as shown on screen. Same text as `habitTitle()` (use that for labels), but in
 * trigger → action habits "When I" and "I will" are a little bolder, so the two halves stand out.
 */
export function HabitTitle({ habit }: { habit: HabitTitleFields }) {
  if (habit.habitType !== 'trigger-action') return <>{habitTitle(habit)}</>
  return (
    <>
      <span className="font-semibold">When I</span> {habitClause(habit.trigger)},{' '}
      <span className="font-semibold">I will</span> {habitClause(habit.action)}
    </>
  )
}
