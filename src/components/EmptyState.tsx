import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface EmptyStateProps {
  title: string
  /** One line on what to do next. */
  children?: ReactNode
  /** Usually the button that creates the first item. */
  action?: ReactNode
  className?: string
}

/** Shown when there is nothing yet: says so plainly and offers the next step. */
export function EmptyState({ title, children, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-start gap-2 rounded-card border border-dashed border-line p-8', className)}>
      <p className="font-serif text-xl">{title}</p>
      {children && <p className="max-w-prose text-ink-muted">{children}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
