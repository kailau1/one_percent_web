import { BookOpenText, CircleUserRound, ListChecks, Moon, Sun, SunMedium } from 'lucide-react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/cn'
import { useTheme } from '@/lib/useTheme'

const destinations = [
  { to: '/today', label: 'Today', icon: SunMedium },
  { to: '/journal', label: 'Journal', icon: BookOpenText },
  { to: '/habits', label: 'Habits', icon: ListChecks },
] as const

function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex items-center gap-3 rounded-control px-3 py-2 text-[0.9375rem] transition-colors',
    isActive ? 'bg-sky-wash font-semibold text-ink' : 'text-ink-muted hover:bg-sunken hover:text-ink',
  )
}

/** The compounding curve: the app's mark. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5 font-serif text-xl font-semibold tracking-tight', className)}>
      <svg aria-hidden viewBox="0 0 28 28" className="size-7">
        <path d="M3 22c6-.4 10-2.5 13.5-7 2-2.600 3.5-5 6-7" fill="none" stroke="var(--sky)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="23" cy="7.5" r="2.8" fill="var(--sunrise)" />
      </svg>
      One Percent
    </span>
  )
}

/** Primary navigation. `onNavigate` lets the mobile drawer close itself after a tap. */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex h-full flex-col gap-8 p-4">
      <Wordmark className="px-2 pt-2" />

      <nav aria-label="Main" className="flex flex-col gap-1">
        {destinations.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={navClass} onClick={onNavigate}>
            <Icon aria-hidden className="size-[1.125rem]" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-4">
        <NavLink to="/account" className={navClass} onClick={onNavigate}>
          <CircleUserRound aria-hidden className="size-[1.125rem]" />
          Account
        </NavLink>
        <button type="button" onClick={toggleTheme} className={navClass({ isActive: false })}>
          {theme === 'dark' ? <Sun aria-hidden className="size-[1.125rem]" /> : <Moon aria-hidden className="size-[1.125rem]" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </div>
  )
}
