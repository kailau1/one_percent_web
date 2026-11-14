import { LogOut } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Button } from '@/components/ui/button'
import { useAuth, useUser } from '@/features/auth/useAuth'

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
      </dl>
      <Button variant="secondary" onClick={logout}>
        <LogOut aria-hidden />
        Log out
      </Button>
    </Page>
  )
}
