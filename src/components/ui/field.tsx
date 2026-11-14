import { useId, type InputHTMLAttributes, type Ref } from 'react'
import { cn } from '@/lib/cn'

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** Validation message shown under the input and announced to screen readers. */
  error?: string
  /** A short helper line under the input (hidden while an error is shown). */
  hint?: string
  ref?: Ref<HTMLInputElement>
}

/** A labelled text input with its error message wired up for accessibility. */
export function Field({ label, error, hint, className, id, ...props }: FieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const messageId = `${inputId}-message`
  const message = error ?? hint

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={cn(
          'h-11 rounded-control border bg-surface px-3 text-base placeholder:text-ink-faint',
          error ? 'border-danger' : 'border-line',
          className,
        )}
        {...props}
      />
      {message && (
        <p id={messageId} className={cn('text-sm', error ? 'text-danger' : 'text-ink-muted')}>
          {message}
        </p>
      )}
    </div>
  )
}
