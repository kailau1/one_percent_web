import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, useWatch, type UseFormRegisterReturn } from 'react-hook-form'
import { z } from 'zod'
import { getErrorMessage } from '@/api/client'
import type { Habit } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { cn } from '@/lib/cn'
import { DEFAULT_COLOUR, HABIT_COLOURS, safeColour } from '../habit'
import { useSaveHabit } from '../hooks'

const schema = z
  .object({
    habitType: z.enum(['standard', 'trigger-action']),
    habitName: z.string().trim(),
    description: z.string().trim(),
    // lower case: these sit mid-sentence ("When I pour my coffee, I will …")
    trigger: z.string().trim().toLowerCase(),
    action: z.string().trim().toLowerCase(),
    colour: z.string(),
  })
  .superRefine((values, context) => {
    const require = (field: 'habitName' | 'trigger' | 'action', message: string) => {
      if (!values[field]) context.addIssue({ code: 'custom', path: [field], message })
    }
    if (values.habitType === 'standard') {
      require('habitName', 'Give the habit a name')
    } else {
      require('trigger', 'Say what sets it off')
      require('action', 'Say what you’ll do')
    }
  })
type FormValues = z.infer<typeof schema>

function valuesFor(habit: Habit | undefined): FormValues {
  return {
    habitType: habit?.habitType ?? 'standard',
    habitName: habit?.habitName ?? '',
    description: habit?.description ?? '',
    trigger: habit?.trigger?.toLowerCase() ?? '',
    action: habit?.action?.toLowerCase() ?? '',
    colour: safeColour(habit?.colour ?? DEFAULT_COLOUR),
  }
}

/** Lower-cases a text box as the user types, keeping the cursor where it was. */
function lowercased(registration: UseFormRegisterReturn): UseFormRegisterReturn {
  return {
    ...registration,
    onChange: (event) => {
      const input = event.target as HTMLInputElement
      const lower = input.value.toLowerCase()
      if (lower !== input.value) {
        const { selectionStart, selectionEnd } = input
        input.value = lower
        input.setSelectionRange(selectionStart, selectionEnd)
      }
      return registration.onChange(event)
    },
  }
}

interface HabitFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The habit to edit; leave out to create one. */
  habit?: Habit
}

/** Create or edit a habit: a plain one, or a "When I …, I will …" trigger → action habit. */
export function HabitFormDialog({ open, onOpenChange, habit }: HabitFormDialogProps) {
  const saveHabit = useSaveHabit()
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: valuesFor(habit) })

  // Each time the dialog opens, start from the habit as it is now (or a blank form).
  useEffect(() => {
    if (open) reset(valuesFor(habit))
  }, [open, habit, reset])

  const habitType = useWatch({ control, name: 'habitType' })
  const colour = useWatch({ control, name: 'colour' })

  const onSubmit = handleSubmit(async (values) => {
    const standard = values.habitType === 'standard'
    try {
      await saveHabit.mutateAsync({
        id: habit?.id,
        input: {
          habitType: values.habitType,
          colour: values.colour,
          // only send the fields that belong to this kind of habit
          habitName: standard ? values.habitName : '',
          description: standard ? values.description : '',
          trigger: standard ? undefined : values.trigger,
          action: standard ? undefined : values.action,
        },
      })
      onOpenChange(false)
    } catch (error) {
      setError('root', { message: getErrorMessage(error) })
    }
  })

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={habit ? 'Edit habit' : 'New habit'}
      actions={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="habit-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : habit ? 'Save changes' : 'Add habit'}
          </Button>
        </>
      }
    >
      <form id="habit-form" onSubmit={onSubmit} noValidate className="mt-5 flex flex-col gap-5">
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Kind of habit</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { value: 'standard', label: 'Simple', hint: 'Something you do each day' },
                { value: 'trigger-action', label: 'When → then', hint: 'Tied to something you already do' },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className={cn(
                  'cursor-pointer rounded-control border px-3 py-2.5 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-action',
                  habitType === option.value ? 'border-action bg-sky-wash' : 'border-line hover:bg-sunken',
                )}
              >
                <input type="radio" value={option.value} className="sr-only" {...register('habitType')} />
                <span className="block font-medium">{option.label}</span>
                <span className="block text-sm text-ink-muted">{option.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {habitType === 'standard' ? (
          <>
            <Field label="Habit" placeholder="Read 10 pages" error={errors.habitName?.message} {...register('habitName')} />
            <Field label="Note (optional)" placeholder="Before bed" {...register('description')} />
          </>
        ) : (
          <>
            <Field label="When I…" placeholder="pour my morning coffee" error={errors.trigger?.message} {...lowercased(register('trigger'))} />
            <Field label="I will…" placeholder="write one line in my journal" error={errors.action?.message} {...lowercased(register('action'))} />
          </>
        )}

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Colour</legend>
          <div className="flex flex-wrap gap-2">
            {HABIT_COLOURS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={colour === option.value}
                aria-label={option.name}
                onClick={() => setValue('colour', option.value, { shouldDirty: true })}
                style={{ backgroundColor: option.value }}
                className={cn('size-8 rounded-full border-2', colour === option.value ? 'border-ink' : 'border-transparent')}
              />
            ))}
          </div>
        </fieldset>

        {errors.root && (
          <p role="alert" className="text-sm text-danger">
            {errors.root.message}
          </p>
        )}
      </form>
    </Dialog>
  )
}
