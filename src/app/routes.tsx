import { Navigate, type RouteObject } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { AccountPage } from '@/features/account/AccountPage'
import { PrintPage } from '@/features/export/PrintPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { PublicOnly, RequireAuth } from '@/features/auth/RequireAuth'
import { SignupPage } from '@/features/auth/SignupPage'
import { HabitsPage } from '@/features/habits/HabitsPage'
import { InsightsPage } from '@/features/insights/InsightsPage'
import { EntryPage } from '@/features/journal/EntryPage'
import { JournalIndex } from '@/features/journal/JournalIndex'
import { JournalLayout } from '@/features/journal/JournalLayout'
import { NewEntryPage } from '@/features/journal/NewEntryPage'
import { TodayPage } from '@/features/today/TodayPage'
import { NotFoundPage } from './NotFoundPage'

/** Every page in the app. Kept as plain data so tests can render the same routes. */
export const routes: RouteObject[] = [
  {
    element: <PublicOnly />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      // the printable journal sits outside the app shell: nothing but the writing on the page
      { path: 'print', element: <PrintPage /> },
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/today" replace /> },
          { path: 'today', element: <TodayPage /> },
          {
            path: 'journal',
            element: <JournalLayout />,
            children: [
              { index: true, element: <JournalIndex /> },
              { path: 'new', element: <NewEntryPage /> },
              { path: ':id', element: <EntryPage /> },
            ],
          },
          { path: 'habits', element: <HabitsPage /> },
          { path: 'insights', element: <InsightsPage /> },
          { path: 'account', element: <AccountPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]
