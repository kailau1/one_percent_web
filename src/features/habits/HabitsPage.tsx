import { EmptyState } from '@/components/EmptyState'
import { Page } from '@/components/layout/Page'

export function HabitsPage() {
  return (
    <Page title="Habits">
      <EmptyState title="Nothing here yet">Your habits and streaks will appear here.</EmptyState>
    </Page>
  )
}
