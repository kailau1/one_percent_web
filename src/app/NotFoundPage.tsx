import { Link } from 'react-router'
import { Page } from '@/components/layout/Page'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <Page title="Page not found">
      <p className="mb-6 text-ink-muted">There's nothing at this address.</p>
      <Button asChild>
        <Link to="/today">Go to Today</Link>
      </Button>
    </Page>
  )
}
