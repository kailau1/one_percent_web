import { LogOut } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Button } from '@/components/ui/button'
import { useAuth, useUser } from '@/features/auth/useAuth'
import { browserTimeZone } from '@/lib/dates'
import { useProfile } from './hooks'

/** "Europe/London" → "Europe / London"; underscores in zone names ("New_York") become spaces. */
function zoneName(zone: string): string {
  return zone.replace(/_/g, ' ').replace(/\//g, ' / ')
}

export function AccountPage() {
  const user = useUser()
  const { logout } = useAuth()
  const profile = useProfile()
  const zone = profile.data?.timeZone ?? browserTimeZone()

  return (
    <Page title="Account">
      <dl className="mb-10 grid max-w-md grid-cols-[auto_1fr] gap-x-8 gap-y-4 border-y border-line py-6">
        <dt className="text-ink-muted">Name</dt>
        <dd>
          {user.firstName} {user.lastName}
        </dd>
        <dt className="text-ink-muted">Email</dt>
        <dd className="break-all">{user.email}</dd>
        <dt className="text-ink-muted">Time zone</dt>
        <dd>
          {zone ? zoneName(zone) : 'Not set'}
          <p className="mt-1 text-sm text-ink-muted">Your days, and your habits, start at midnight here. It follows this device.</p>
        </dd>
      </dl>
      <Button variant="secondary" onClick={logout}>
        <LogOut aria-hidden />
        Log out
      </Button>
    </Page>
  )
}
