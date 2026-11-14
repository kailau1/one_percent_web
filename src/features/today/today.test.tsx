import { screen, waitFor, within } from '@testing-library/react'
import { format } from 'date-fns'
import { http, HttpResponse } from 'msw'
import { routes } from '@/app/routes'
import { signIn } from '@/test/auth'
import { db, dayKey } from '@/test/msw/db'
import { API } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderRoutes } from '@/test/renderWithProviders'

beforeEach(() => {
  signIn()
  // entries dated relative to now, so "this year" and "today" always line up with the app
  db.journals = [
    { id: 'j1', title: 'Two days ago', content: 'x', llmResponse: null, createdAt: `${dayKey(2)}T08:00:00` },
    { id: 'j2', title: 'Last week', content: 'y', llmResponse: null, createdAt: `${dayKey(8)}T20:00:00` },
  ]
})

const year = () => screen.findByRole('region', { name: 'Your year' })

describe('Today', () => {
  it("shows today's date and greets the user by name", async () => {
    renderRoutes(routes, { route: '/today' })

    expect(await screen.findByRole('heading', { level: 1, name: format(new Date(), 'EEEE d MMMM') })).toBeInTheDocument()
    expect(screen.getByText(/, Kai$/)).toBeInTheDocument()
  })

  it('counts the days you showed up this year and what they compound to', async () => {
    // default habit history: h1 on days 1,2,3,6 ago; h2 today + yesterday (h2 is ticked now)
    // plus entries 2 and 8 days ago => distinct days: 0,1,2,3,6,8 = 6 (if all fall in this year)
    renderRoutes(routes, { route: '/today' })
    const region = await year()

    const daysThisYear = [0, 1, 2, 3, 6, 8].filter((n) => dayKey(n).startsWith(String(new Date().getFullYear()))).length
    await waitFor(() =>
      expect(within(region).getByRole('img')).toHaveAccessibleName(new RegExp(`^You showed up on ${daysThisYear} of \\d+ days so far this year$`)),
    )
    expect(within(region).getByText(new RegExp(`shown up on ${daysThisYear} days? this year`))).toBeInTheDocument()
    expect(within(region).getByText(`${Math.pow(1.01, daysThisYear).toFixed(2)}×`)).toBeInTheDocument()
  })

  it('invites a first mark when nothing has been done yet', async () => {
    db.journals = []
    db.history = []
    db.habits = db.habits.map((h) => ({ ...h, completed: false }))
    renderRoutes(routes, { route: '/today' })

    expect(await within(await year()).findByText(/Every mark is a day/)).toBeInTheDocument()
  })

  it("lists today's habits and ticks one off, which counts today", async () => {
    db.history = []
    db.journals = []
    db.habits = db.habits.map((h) => ({ ...h, completed: false }))
    const { user } = renderRoutes(routes, { route: '/today' })
    const list = await screen.findByRole('list', { name: 'Today’s habits' })
    expect(screen.getByText('0 of 3 done')).toBeInTheDocument()

    await user.click(within(list).getByRole('checkbox', { name: 'Read 10 pages: done today' }))

    expect(await screen.findByText('1 of 3 done')).toBeInTheDocument()
    expect(await within(await year()).findByText(/shown up on 1 day this year/)).toBeInTheDocument()
    await waitFor(() => expect(db.habits.find((h) => h.id === 'h1')!.completed).toBe(true))
  })

  it('offers to write today’s entry, or continue it if one exists', async () => {
    const first = renderRoutes(routes, { route: '/today' })
    expect(await screen.findByRole('link', { name: 'Write today’s entry' })).toHaveAttribute('href', '/journal/new')
    first.unmount()

    db.journals = [...db.journals, { id: 'j9', title: 'This morning', content: 'z', llmResponse: null, createdAt: `${dayKey(0)}T07:00:00` }]
    renderRoutes(routes, { route: '/today' })

    expect(await screen.findByRole('link', { name: 'Continue today’s entry' })).toHaveAttribute('href', '/journal/j9')
  })

  it('links to recent entries, newest first', async () => {
    renderRoutes(routes, { route: '/today' })

    const recent = await screen.findByRole('list', { name: 'Recent entries' })
    const links = within(recent).getAllByRole('link')
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/journal/j1', '/journal/j2'])
  })

  it('keeps the rest of the page working when habits fail to load', async () => {
    server.use(http.get(`${API}/api/habits/me`, () => HttpResponse.error()))
    renderRoutes(routes, { route: '/today' })

    expect(await screen.findByRole('alert')).toHaveTextContent(/can't reach/i)
    expect(await screen.findByRole('list', { name: 'Recent entries' })).toBeInTheDocument()
    expect(await screen.findByText(db.tip)).toBeInTheDocument()
  })

  it('shows one banner and one retry for the whole page when the server is unreachable', async () => {
    let down = true
    const flaky = (path: string, ok: () => Response) =>
      http.get(`${API}${path}`, () => (down ? HttpResponse.error() : ok()))
    server.use(
      flaky('/api/habits/me', () => HttpResponse.json(db.habits)),
      flaky('/api/journals/me', () => HttpResponse.json(db.journals)),
      flaky('/api/habit-history', () => HttpResponse.json(db.history)),
      flaky('/api/ai/tip', () => HttpResponse.json({ response: db.tip })),
    )
    const { user } = renderRoutes(routes, { route: '/today' })

    await screen.findByRole('alert')
    await waitFor(() => expect(screen.getAllByText('Not loaded.').length).toBeGreaterThanOrEqual(3))
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Try again' })).toHaveLength(1)
    // an outage must not read as "you've done nothing this year"
    expect(screen.getByText('Your year so far isn’t loaded.')).toBeInTheDocument()
    expect(screen.queryByText(/Every mark is a day/)).not.toBeInTheDocument()

    down = false
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('list', { name: 'Today’s habits' })).toBeInTheDocument()
    expect(await screen.findByRole('list', { name: 'Recent entries' })).toBeInTheDocument()
    expect(await screen.findByText(db.tip)).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('opens a new entry with the N key from anywhere', async () => {
    const { user, router } = renderRoutes(routes, { route: '/today' })
    await year()

    await user.keyboard('n')

    await waitFor(() => expect(router.state.location.pathname).toBe('/journal/new'))
  })
})
