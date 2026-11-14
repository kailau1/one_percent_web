import type { ReactNode } from 'react'
import { Wordmark } from '@/components/layout/Sidebar'
import { CompoundingCurve } from './CompoundingCurve'

interface AuthLayoutProps {
  title: string
  children: ReactNode
  /** The line under the form linking to the other auth page. */
  footer: ReactNode
}

/** Shared frame for login and sign-up: the form on one side, what the app is about on the other. */
export function AuthLayout({ title, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <main className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Wordmark className="mb-12" />
          <h1 className="mb-8 font-serif text-4xl font-medium tracking-tight">{title}</h1>
          {children}
          <p className="mt-8 text-ink-muted">{footer}</p>
        </div>
      </main>

      <aside className="auth-aside hidden flex-col justify-center gap-10 px-16 lg:flex">
        <p className="max-w-md font-serif text-[2.5rem] leading-[1.15] tracking-tight">
          Get one percent better every day, and a year from now you’re thirty-seven times better.
        </p>
        <CompoundingCurve className="max-w-lg" />
        <p className="max-w-sm opacity-70">
          A journal for thinking it through, habits for showing up, and feedback that remembers what you’ve already tried.
        </p>
      </aside>
    </div>
  )
}
