import { EmptyState } from '@/components/EmptyState'
import { Page } from '@/components/layout/Page'

export function JournalPage() {
  return (
    <Page title="Journal">
      <EmptyState title="Nothing here yet">Your entries will appear here.</EmptyState>
    </Page>
  )
}
