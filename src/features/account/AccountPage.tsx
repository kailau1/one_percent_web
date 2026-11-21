import { LogOut } from 'lucide-react'
import { ErrorState } from '@/components/ErrorState'
import { Page } from '@/components/layout/Page'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth, useUser } from '@/features/auth/useAuth'
import { ExportSection } from '@/features/export/ExportSection'
import { useProfile } from './hooks'

/** "Europe/London" → "Europe / London"; underscores in zone names ("New_York") become spaces. */
function zoneName(zone: string): string {
  return zone.replace(/_/g, ' ').replace(/\//g, ' / ')
}

/** The time zone the server counts days in (not the browser's guess: they differ until synced). */
function TimeZone() {
  const { data, error, isPending, refetch, isFetching } = useProfile()

  if (isPending) return <Skeleton className="h-5 w-40" aria-label="Loading time zone" role="status" />
  if (error && !data) return <ErrorState compact error={error} onRetry={() => refetch()} retrying={isFetching} />
  if (!data.timeZone) {
    return <p className="text-ink-muted">Not set yet. Days follow the server’s clock until this device sets it.</p>
  }
  return (
    <>
      {zoneName(data.timeZone)}
      <p className="mt-1 text-sm text-ink-muted">Your days, and your habits, start at midnight here. It follows the device you use.</p>
    </>
  )
}

export function AccountPage() {
  const user = useUser()
  const { logout } = useAuth()

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
          <TimeZone />
        </dd>
      </dl>
      <ExportSection />
      <div className="mt-12 max-w-md border-t border-line pt-8">
        <Button variant="secondary" onClick={logout}>
          <LogOut aria-hidden />
          Log out
        </Button>
      </div>
    </Page>
  )
}
