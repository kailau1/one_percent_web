import * as Dialog from '@radix-ui/react-dialog'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { OfflineBanner } from '@/components/OfflineBanner'
import { Button } from '@/components/ui/button'
import { useTimeZoneSync } from '@/features/account/hooks'
import { useShortcut } from '@/lib/useShortcut'
import { Sidebar, Wordmark } from './Sidebar'

/**
 * The frame around every signed-in page: a fixed sidebar on wide screens; below 1024px a top
 * bar whose menu button opens the same sidebar as a drawer.
 */
export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  // N starts a new journal entry from anywhere (ignored while typing in a field).
  useShortcut('n', () => navigate('/journal/new'))
  // days (habit ticks, today's entry) start at midnight where this device is
  useTimeZoneSync()

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-control focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>

      <aside className="hidden w-60 shrink-0 border-r border-line bg-surface lg:block">
        <div className="sticky top-0 h-dvh">
          <Sidebar />
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
        <Wordmark />
        <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <Dialog.Trigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu aria-hidden />
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/40" />
            <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-line bg-surface" aria-describedby={undefined}>
              <Dialog.Title className="sr-only">Menu</Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" aria-label="Close menu" className="absolute right-3 top-4">
                  <X aria-hidden />
                </Button>
              </Dialog.Close>
              <Sidebar onNavigate={() => setMenuOpen(false)} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </header>

      <div className="flex min-w-0 flex-1 flex-col">
        <OfflineBanner />
        <main id="main" className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
