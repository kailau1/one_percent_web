import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { routes } from '@/app/routes'
import { signIn } from '@/test/auth'
import { db } from '@/test/msw/db'
import { API } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderRoutes } from '@/test/renderWithProviders'
import { themeLabel } from './themes'

beforeEach(() => {
  signIn()
})

const chips = () => screen.findByRole('group', { name: 'Themes' })
const stored = (id: string) => db.journals.find((j) => j.id === id)!.themes

describe('entry themes', () => {
  it("shows the entry's themes, strongest first", async () => {
    renderRoutes(routes, { route: '/journal/j1' })

    const group = await chips()
    expect(within(group).getByText('Procrastination')).toBeInTheDocument()
    expect(within(group).getByText('Self-doubt')).toBeInTheDocument()
    expect(group.textContent!.indexOf('Procrastination')).toBeLessThan(group.textContent!.indexOf('Self-doubt'))
  })

  it('says so when an entry has no themes', async () => {
    renderRoutes(routes, { route: '/journal/j2' })

    expect(within(await chips()).getByText('No themes')).toBeInTheDocument()
  })

  it('removes a wrong theme', async () => {
    const { user } = renderRoutes(routes, { route: '/journal/j1' })

    await user.click(within(await chips()).getByRole('button', { name: 'Remove theme Self-doubt' }))

    await waitFor(() => expect(stored('j1')).toEqual(['procrastination']))
    expect(within(await chips()).queryByText('Self-doubt')).not.toBeInTheDocument()
  })

  it('adds a missing theme from the themes it does not have yet', async () => {
    const { user } = renderRoutes(routes, { route: '/journal/j1' })

    await user.click(within(await chips()).getByRole('button', { name: 'Add theme' }))
    const menu = await screen.findByRole('menu')
    expect(within(menu).queryByRole('menuitem', { name: 'Procrastination' })).not.toBeInTheDocument() // already has it
    await user.click(within(menu).getByRole('menuitem', { name: 'Anxiety' }))

    await waitFor(() => expect(stored('j1')).toEqual(['procrastination', 'self-doubt', 'anxiety']))
    expect(within(await chips()).getByText('Anxiety')).toBeInTheDocument()
  })

  it('puts the theme back and says why if the change fails', async () => {
    server.use(http.put(`${API}/api/journals/entry/:id/themes`, () => HttpResponse.error()))
    const { user } = renderRoutes(routes, { route: '/journal/j1' })

    await user.click(within(await chips()).getByRole('button', { name: 'Remove theme Self-doubt' }))

    expect(await screen.findByText(/can't reach the one percent server/i)).toBeInTheDocument()
    await waitFor(() => expect(within(screen.getByRole('group', { name: 'Themes' })).getByText('Self-doubt')).toBeInTheDocument())
    expect(stored('j1')).toEqual(['procrastination', 'self-doubt'])
  })

  it('can be used with the keyboard', async () => {
    const { user } = renderRoutes(routes, { route: '/journal/j1' })
    const addButton = within(await chips()).getByRole('button', { name: 'Add theme' })

    addButton.focus()
    await user.keyboard('{Enter}')
    await screen.findByRole('menu')
    await user.keyboard('{Enter}') // first item: Anxiety

    await waitFor(() => expect(stored('j1')).toContain('anxiety'))
  })

  it('refreshes Insights after a correction', async () => {
    let insightsRequests = 0
    server.use(
      http.get(`${API}/api/insights/themes`, () => {
        insightsRequests++
        return HttpResponse.json(db.insights)
      }),
    )
    const { user, router } = renderRoutes(routes, { route: '/insights' })
    await waitFor(() => expect(insightsRequests).toBe(1))

    await router.navigate('/journal/j1')
    await user.click(within(await chips()).getByRole('button', { name: 'Remove theme Self-doubt' }))
    await waitFor(() => expect(stored('j1')).toEqual(['procrastination']))
    await router.navigate('/insights')

    await waitFor(() => expect(insightsRequests).toBe(2))
  })

  it('is not shown on a new, unsaved entry', async () => {
    renderRoutes(routes, { route: '/journal/new' })

    await screen.findByRole('textbox', { name: 'Entry' })
    expect(screen.queryByRole('group', { name: 'Themes' })).not.toBeInTheDocument()
  })
})

describe('themeLabel', () => {
  it('capitalises the first letter only', () => {
    expect(themeLabel('self-doubt')).toBe('Self-doubt')
    expect(themeLabel('emotional regulation')).toBe('Emotional regulation')
  })
})
