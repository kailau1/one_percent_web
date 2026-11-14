import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface PageProps {
  title: string
  /** Sits to the right of the title: usually the page's main action. */
  action?: ReactNode
  children: ReactNode
  className?: string
}

/** Standard page padding and heading, so every screen starts at the same place. */
export function Page({ title, action, children, className }: PageProps) {
  return (
    <div className={cn('mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12', className)}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-4xl font-medium tracking-tight">{title}</h1>
        {action}
      </div>
      {children}
    </div>
  )
}
