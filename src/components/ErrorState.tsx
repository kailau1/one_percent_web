import { CircleAlert, RotateCw, WifiOff } from 'lucide-react'
import { toApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

interface ErrorStateProps {
  /** Anything thrown is accepted and turned into a message that is safe to show. */
  error: unknown
  /** Shows a "Try again" button when provided. */
  onRetry?: () => void
  /** Disables the button while a retry is in flight. */
  retrying?: boolean
  /** A slim banner (e.g. above data that is still on screen) instead of a centred block. */
  compact?: boolean
  className?: string
}

/**
 * One consistent way to say "that didn't work": what happened, and a way to try again.
 * Being unable to reach the server looks different from the server answering with an error.
 */
export function ErrorState({ error, onRetry, retrying, compact, className }: ErrorStateProps) {
  const apiError = toApiError(error)
  const offline = apiError.isOffline
  const Icon = offline ? WifiOff : CircleAlert

  return (
    <div
      role="alert"
      className={cn(
        'rounded-card border text-ink',
        offline ? 'border-warning-line bg-warning-wash' : 'border-danger/30 bg-danger-wash',
        compact ? 'flex items-center gap-3 px-4 py-2.5 text-sm' : 'flex flex-col items-start gap-3 p-6',
        className,
      )}
    >
      <Icon aria-hidden className={cn('shrink-0', compact ? 'size-4' : 'size-6', !offline && 'text-danger')} />
      <div className={cn(compact && 'flex-1')}>
        {!compact && (
          <p className="font-semibold">{offline ? "Can't connect" : 'Something went wrong'}</p>
        )}
        <p className={cn(!compact && 'mt-1 text-ink-muted')}>{apiError.message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} disabled={retrying}>
          <RotateCw aria-hidden className={cn(retrying && 'animate-spin')} />
          Try again
        </Button>
      )}
    </div>
  )
}
