import { Navigate, Outlet, useLocation } from 'react-router'
import { safeNext } from './safeNext'
import { useAuth } from './useAuth'

/** Wraps the signed-in pages: without a session, go to login and remember where we were headed. */
export function RequireAuth() {
  const { user, loggedOut } = useAuth()
  const location = useLocation()

  if (!user) {
    const next = location.pathname + location.search
    // After choosing to log out there's nowhere to "come back to": show a clean login page.
    const remember = !loggedOut && next && next !== '/'
    const target = remember ? `/login?next=${encodeURIComponent(next)}` : '/login'
    return <Navigate to={target} replace />
  }
  return <Outlet />
}

/** Wraps login and sign-up: someone already logged in has no business there. */
export function PublicOnly() {
  const { user } = useAuth()
  const location = useLocation()

  if (user) return <Navigate to={safeNext(new URLSearchParams(location.search).get('next'))} replace />
  return <Outlet />
}
