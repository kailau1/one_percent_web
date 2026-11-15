import { QueryClient } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router'
import { Providers } from '@/app/providers'

function testQueryClient(appCaching: boolean) {
  // No retries; and by default no caching, so every render fetches. `appCaching` keeps the app's real
  // freshness rules (data reused for 30s), for tests about what refreshes after a change.
  return new QueryClient({
    defaultOptions: {
      queries: appCaching ? { retry: false, staleTime: 30_000 } : { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

/** Renders one component inside the app's providers, at a given URL. */
export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  return renderRoutes([{ path: '*', element: ui }], { route })
}

/** Renders a set of routes (e.g. the real app routes) starting at a given URL. */
export function renderRoutes(routes: RouteObject[], { route = '/', appCaching = false }: { route?: string; appCaching?: boolean } = {}) {
  const router = createMemoryRouter(routes, { initialEntries: [route] })
  const user = userEvent.setup()
  const view = render(
    <Providers queryClient={testQueryClient(appCaching)}>
      <RouterProvider router={router} />
    </Providers>,
  )
  return { ...view, user, router }
}
