import { Navigate, type RouteObject } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { AccountPage } from '@/features/account/AccountPage'
import { HabitsPage } from '@/features/habits/HabitsPage'
import { JournalPage } from '@/features/journal/JournalPage'
import { TodayPage } from '@/features/today/TodayPage'
import { NotFoundPage } from './NotFoundPage'

/** Every page in the app. Kept as plain data so tests can render the same routes. */
export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/today" replace /> },
      { path: 'today', element: <TodayPage /> },
      { path: 'journal', element: <JournalPage /> },
      { path: 'habits', element: <HabitsPage /> },
      { path: 'account', element: <AccountPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
