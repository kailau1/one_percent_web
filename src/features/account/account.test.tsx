import { act, screen, waitFor } from '@testing-library/react'
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

afterEach(() => {
  server.events.removeAllListeners()
  vi.restoreAllMocks()
})

/** Records the API calls the app makes, e.g. "GET /api/users/me" or "PUT /api/users/me/time-zone Asia/Tokyo". */
function recordCalls() {
  const calls: string[] = []
  server.events.on('request:start', async ({ request }) => {
    const path = new URL(request.url).pathname
    if (request.method === 'PUT' && path === '/api/users/me/time-zone') {
      calls.push(`PUT ${path} ${((await request.clone().json()) as { timeZone: string }).timeZone}`)
    } else {
      calls.push(`${request.method} ${path}`)
    }
  })
  return calls
}
const zoneUpdates = (calls: string[]) => calls.filter((call) => call.startsWith('PUT /api/users/me/time-zone'))
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 50)))

describe('time zone sync', () => {
  it("tells the server this device's time zone when it has none yet", async () => {
    db.profile = { ...db.profile, timeZone: null }
    renderRoutes(routes, { route: '/today' })

    await waitFor(() => expect(db.profile.timeZone).toBe('Europe/London'))
  })

  it('updates it after travelling, and the account page shows the new zone', async () => {
    db.profile = { ...db.profile, timeZone: 'America/New_York' }
    renderRoutes(routes, { route: '/account' })

    await waitFor(() => expect(db.profile.timeZone).toBe('Europe/London'))
    expect(await screen.findByText('Europe / London')).toBeInTheDocument()
  })

  it("leaves it alone when it's already right", async () => {
    const calls = recordCalls()
    renderRoutes(routes, { route: '/account' })

    await waitFor(() => expect(calls).toContain('GET /api/users/me'))
    expect(await screen.findByText('Europe / London')).toBeInTheDocument()
    await settle()
    expect(zoneUpdates(calls)).toEqual([])
  })

  it('tries once, quietly, if the server refuses the zone', async () => {
    db.profile = { ...db.profile, timeZone: null }
    const calls = recordCalls()
    server.use(http.put(`${API}/api/users/me/time-zone`, () => new HttpResponse('Not a zone', { status: 400 })))
    renderRoutes(routes, { route: '/today' })

    await waitFor(() => expect(zoneUpdates(calls)).toEqual(['PUT /api/users/me/time-zone Europe/London']))
    await settle()
    expect(zoneUpdates(calls)).toHaveLength(1)
    // nothing for the user to fix, so no error appears
    expect(screen.queryByText('Not a zone')).not.toBeInTheDocument()
  })

  it("tries again when the connection comes back if the server couldn't be reached", async () => {
    db.profile = { ...db.profile, timeZone: null }
    const calls = recordCalls()
    server.use(http.put(`${API}/api/users/me/time-zone`, () => HttpResponse.error(), { once: true }))
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    renderRoutes(routes, { route: '/today' })
    await waitFor(() => expect(zoneUpdates(calls)).toHaveLength(1))
    await settle()
    expect(db.profile.timeZone).toBeNull()

    // the connection drops and comes back
    onLine.mockReturnValue(false)
    act(() => void window.dispatchEvent(new Event('offline')))
    onLine.mockReturnValue(true)
    act(() => void window.dispatchEvent(new Event('online')))

    await waitFor(() => expect(db.profile.timeZone).toBe('Europe/London'))
    expect(zoneUpdates(calls)).toHaveLength(2)
  })
})

describe('account page', () => {
  it("shows the time zone the server counts days in", async () => {
    renderRoutes(routes, { route: '/account' })

    expect(await screen.findByText('Europe / London')).toBeInTheDocument()
    expect(screen.getByText(/start at midnight here/)).toBeInTheDocument()
  })

  it("says so when the server hasn't got one, rather than guessing", async () => {
    db.profile = { ...db.profile, timeZone: null }
    server.use(http.put(`${API}/api/users/me/time-zone`, () => new HttpResponse('Not a zone', { status: 400 })))
    renderRoutes(routes, { route: '/account' })

    expect(await screen.findByText(/Not set yet/)).toBeInTheDocument()
    expect(screen.queryByText('Europe / London')).not.toBeInTheDocument()
  })

  it("shows a retry if the profile can't be loaded", async () => {
    server.use(http.get(`${API}/api/users/me`, () => HttpResponse.error(), { once: true }))
    const { user } = renderRoutes(routes, { route: '/account' })

    await user.click(await screen.findByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Europe / London')).toBeInTheDocument()
  })
})
