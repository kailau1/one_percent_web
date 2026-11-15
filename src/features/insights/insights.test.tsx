import { act, screen, waitFor, within } from '@testing-library/react'
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

describe('insights', () => {
  it('is in the main navigation', async () => {
    const { user, router } = renderRoutes(routes, { route: '/today' })

    await user.click(within(screen.getAllByRole('navigation', { name: 'Main' })[0]).getByRole('link', { name: 'Insights' }))

    expect(router.state.location.pathname).toBe('/insights')
  })

  it('lists themes, most common first, with how many entries touch each', async () => {
    renderRoutes(routes, { route: '/insights' })

    const themes = await screen.findByRole('list', { name: 'Themes' })
    const headings = within(themes).getAllByRole('heading').map((h) => h.textContent)
    expect(headings).toEqual(['Procrastination', 'Self-doubt'])
    expect(within(themes).getByText('in 2 entries')).toBeInTheDocument()
    expect(within(themes).getByText('in 1 entry')).toBeInTheDocument()
  })

  it('links each theme to its recent entries', async () => {
    const { user, router } = renderRoutes(routes, { route: '/insights' })

    const recent = await screen.findByRole('list', { name: 'Recent entries about procrastination' })
    await user.click(within(recent).getByRole('link', { name: 'A slow start' }))

    expect(router.state.location.pathname).toBe('/journal/j1')
  })

  it('says how many entries were left out because they could not be analysed', async () => {
    renderRoutes(routes, { route: '/insights' })

    expect(await screen.findByText(/across 2 entries\. 1 entry was saved while AI analysis was unavailable/)).toBeInTheDocument()
  })

  it('invites a first entry when there are none', async () => {
    db.insights = { totalEntries: 0, analysedEntries: 0, themes: [] }
    renderRoutes(routes, { route: '/insights' })

    expect(await screen.findByText('No themes yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Write an entry' })).toHaveAttribute('href', '/journal/new')
  })

  it('explains when no entry could be analysed, rather than showing nothing', async () => {
    db.insights = { totalEntries: 4, analysedEntries: 0, themes: [] }
    renderRoutes(routes, { route: '/insights' })

    expect(await screen.findByText('Your entries haven’t been analysed yet')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Themes' })).not.toBeInTheDocument()
  })

  it('is refreshed after an entry is deleted, so it never links to a deleted entry', async () => {
    // with the app's caching, insights loaded moments ago would otherwise be reused as they were
    const { user, router } = renderRoutes(routes, { route: '/insights', appCaching: true })
    await screen.findByRole('list', { name: 'Recent entries about procrastination' })

    await act(() => router.navigate('/journal/j1'))
    await user.click(await screen.findByRole('button', { name: 'Delete entry' }))
    const dialog = await screen.findByRole('dialog', { name: 'Delete this entry?' })
    // what the server would now compute without j1
    db.insights = {
      totalEntries: 2,
      analysedEntries: 1,
      themes: [{ name: 'procrastination', entryCount: 1, recentEntries: [{ id: 'j2', title: 'Good run', createdAt: '2026-11-10T19:40:00Z' }] }],
    }
    await user.click(within(dialog).getByRole('button', { name: 'Delete entry' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/journal'))

    await act(() => router.navigate('/insights'))

    const recent = await screen.findByRole('list', { name: 'Recent entries about procrastination' })
    await waitFor(() => expect(within(recent).queryByRole('link', { name: 'A slow start' })).not.toBeInTheDocument())
    expect(within(recent).getByRole('link', { name: 'Good run' })).toBeInTheDocument()
  })

  it("shows a retry when the server can't be reached, and recovers", async () => {
    server.use(http.get(`${API}/api/insights/themes`, () => HttpResponse.error(), { once: true }))
    const { user } = renderRoutes(routes, { route: '/insights' })

    expect(await screen.findByRole('alert')).toHaveTextContent(/can't reach/i)
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('list', { name: 'Themes' })).toBeInTheDocument()
  })
})
