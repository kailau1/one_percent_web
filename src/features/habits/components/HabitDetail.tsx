import * as RadixDialog from '@radix-ui/react-dialog'
import { Pencil, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api/client'
import type { Habit } from '@/api/types'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { habitTitle, safeColour } from '../habit'
import { useDeleteHabit, useHabitHistory } from '../hooks'
import { calculateCurrentStreak, calculateLongestStreak, withToday } from '../streaks'
import { HabitFormDialog } from './HabitFormDialog'
import { HabitToggle } from './HabitToggle'
import { Heatmap } from './Heatmap'

interface HabitDetailProps {
  /** The habit to show; null closes the drawer. */
  habit: Habit | null
  onClose: () => void
  onToggle: (habit: Habit, completed: boolean) => void
}

function Stat({ label, days }: { label: string; days: number }) {
  return (
    <div>
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="font-serif text-3xl">
        {days} <span className="text-base text-ink-muted">{days === 1 ? 'day' : 'days'}</span>
      </dd>
    </div>
  )
}

/** A drawer with one habit's streaks and history, plus edit and delete. */
export function HabitDetail({ habit, onClose, onToggle }: HabitDetailProps) {
  const history = useHabitHistory(habit?.id)
  const deleteHabit = useDeleteHabit()
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function confirmDelete() {
    if (!habit) return
    deleteHabit.mutate(habit.id, {
      onSuccess: () => {
        setConfirmingDelete(false)
        toast.success('Habit deleted')
        onClose()
      },
      onError: (error) => {
        setConfirmingDelete(false)
        toast.error(getErrorMessage(error))
      },
    })
  }

  const colour = safeColour(habit?.colour)
  const records = habit && history.data ? withToday(history.data, habit.completed) : null

  return (
    <>
      <RadixDialog.Root open={habit !== null} onOpenChange={(open) => !open && onClose()}>
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="fixed inset-0 z-40 bg-ink/40" />
          <RadixDialog.Content
            aria-describedby={undefined}
            className="fixed inset-y-0 right-0 z-50 flex w-[min(30rem,100vw)] flex-col gap-8 overflow-y-auto border-l border-line bg-surface p-6 sm:p-8"
          >
            {habit && (
              <>
                <div className="flex items-start gap-4">
                  <HabitToggle
                    size="lg"
                    checked={habit.completed}
                    onChange={(completed) => onToggle(habit, completed)}
                    label={habitTitle(habit)}
                    colour={colour}
                  />
                  <div className="min-w-0 flex-1">
                    <RadixDialog.Title className="font-serif text-2xl leading-snug">{habitTitle(habit)}</RadixDialog.Title>
                    {habit.habitType === 'standard' && habit.description && <p className="mt-1 text-ink-muted">{habit.description}</p>}
                    <p className="mt-1 text-sm text-ink-muted">{habit.completed ? 'Done today' : 'Not done yet today'}</p>
                  </div>
                  <RadixDialog.Close asChild>
                    <Button variant="ghost" size="icon" aria-label="Close">
                      <X aria-hidden />
                    </Button>
                  </RadixDialog.Close>
                </div>

                {history.isPending && (
                  <div role="status" aria-label="Loading history" className="flex flex-col gap-4">
                    <Skeleton className="h-14 w-2/3" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                )}
                {history.error && !history.data && (
                  <ErrorState compact error={history.error} onRetry={() => history.refetch()} retrying={history.isFetching} className="flex-wrap" />
                )}
                {records && (
                  <>
                    <dl className="grid grid-cols-2 gap-6">
                      <Stat label="Current streak" days={calculateCurrentStreak(records)} />
                      <Stat label="Longest streak" days={calculateLongestStreak(records)} />
                    </dl>
                    <section aria-label="History">
                      <h3 className="mb-3 font-serif text-xl">Last 18 weeks</h3>
                      <div className="overflow-x-auto pb-1">
                        <Heatmap history={records} colour={colour} />
                      </div>
                    </section>
                  </>
                )}

                <div className="mt-auto flex gap-3 border-t border-line pt-6">
                  <Button variant="secondary" onClick={() => setEditing(true)}>
                    <Pencil aria-hidden />
                    Edit
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmingDelete(true)}>
                    <Trash2 aria-hidden />
                    Delete
                  </Button>
                </div>
              </>
            )}
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>

      <HabitFormDialog open={editing} onOpenChange={setEditing} habit={habit ?? undefined} />

      <Dialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title="Delete this habit?"
        description="The habit and its history will be gone for good. This can’t be undone."
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>
              Keep habit
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleteHabit.isPending}>
              {deleteHabit.isPending ? 'Deleting…' : 'Delete habit'}
            </Button>
          </>
        }
      />
    </>
  )
}
