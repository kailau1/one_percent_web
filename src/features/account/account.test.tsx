import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { routes } from '@/app/routes'
import { signIn } from '@/test/auth'
import { db } from '@/test/msw/db'
import { API } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderRoutes } from '@/test/renderWithProviders'

beforeEach(() => {
  signIn()
})

/** Counts PUT /api/users/me/time-zone calls (then lets the default handler answer). */
function countZoneUpdates() {
  const calls: string[] = []
  server.events.on('request:start', async ({ request }) => {
    if (request.method === 'PUT' && request.url.endsWith('/api/users/me/time-zone')) {
      calls.push(((await request.clone().json()) as { timeZone: string }).timeZone)
    }
  })
  return calls
}

describe('time zone', () => {
  afterEach(() => server.events.removeAllListeners())

  it("tells the server this device's time zone when it has none yet", async () => {
    db.profile = { ...db.profile, timeZone: null }
    renderRoutes(routes, { route: '/today' })

    await waitFor(() => expect(db.profile.timeZone).toBe('Europe/London'))
  })

  it('updates it after travelling', async () => {
    db.profile = { ...db.profile, timeZone: 'America/New_York' }
    renderRoutes(routes, { route: '/account' })

    await waitFor(() => expect(db.profile.timeZone).toBe('Europe/London'))
    expect(await screen.findByText('Europe / London')).toBeInTheDocument()
  })

  it("leaves it alone when it's already right", async () => {
    const calls = countZoneUpdates()
    renderRoutes(routes, { route: '/account' })

    expect(await screen.findByText('Europe / London')).toBeInTheDocument()
    expect(calls).toEqual([])
  })

  it('tries once, quietly, if the server refuses the zone', async () => {
    db.profile = { ...db.profile, timeZone: null }
    const calls = countZoneUpdates()
    server.use(http.put(`${API}/api/users/me/time-zone`, () => new HttpResponse('Not a zone', { status: 400 })))
    renderRoutes(routes, { route: '/today' })

    await waitFor(() => expect(calls).toEqual(['Europe/London']))
    // nothing for the user to fix, so no error appears
    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByText('Not a zone')).not.toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(calls).toHaveLength(1)
  })
})

describe('account page', () => {
  it('shows the time zone days are counted in', async () => {
    renderRoutes(routes, { route: '/account' })

    expect(await screen.findByText('Time zone')).toBeInTheDocument()
    expect(await screen.findByText('Europe / London')).toBeInTheDocument()
    expect(screen.getByText(/start at midnight here/)).toBeInTheDocument()
  })
})
