import { EmptyState } from '@/components/EmptyState'
import { Page } from '@/components/layout/Page'

export function TodayPage() {
  return (
    <Page title="Today">
      <EmptyState title="Nothing here yet">Your day at a glance will live here: today's habits, a place to start writing, and the tip of the day.</EmptyState>
    </Page>
  )
}
