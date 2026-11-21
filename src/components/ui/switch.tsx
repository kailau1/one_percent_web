import { cn } from '@/lib/cn'

/** An on/off switch. `label` is its accessible name; show visible text next to it as well. */
export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition-colors disabled:opacity-50',
        checked ? 'border-action bg-action' : 'border-line bg-sunken',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'inline-block size-4 rounded-full shadow-sm transition-transform',
          checked ? 'translate-x-[1.1rem] bg-on-action' : 'translate-x-1 bg-ink-faint',
        )}
      />
    </button>
  )
}
