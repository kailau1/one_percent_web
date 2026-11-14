import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/** A quiet placeholder block shown while content loads, shaped like what will replace it. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn('animate-pulse rounded-control bg-sunken', className)} {...props} />
}
