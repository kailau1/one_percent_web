import { cn } from '@/lib/cn'

interface HabitToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** What is being ticked, for screen readers: the habit's title. */
  label: string
  colour: string
  size?: 'md' | 'lg'
}

/**
 * The round tick for "done today", in the habit's own colour. A real checkbox semantically
 * (role, aria-checked, Space toggles), drawn as a circle whose tick strokes itself in.
 */
export function HabitToggle({ checked, onChange, label, colour, size = 'md' }: HabitToggleProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={`${label}: done today`}
      onClick={() => onChange(!checked)}
      style={{ borderColor: colour, backgroundColor: checked ? colour : 'transparent' }}
      className={cn(
        'grid shrink-0 place-items-center rounded-full border-2 transition-colors',
        size === 'lg' ? 'size-11' : 'size-9',
      )}
    >
      <svg viewBox="0 0 24 24" aria-hidden className={cn('text-on-habit', size === 'lg' ? 'size-6' : 'size-5')}>
        {checked && (
          <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" pathLength="1" className="tick-draw" />
        )}
      </svg>
    </button>
  )
}
