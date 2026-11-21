import { screen, waitFor, within } from '@testing-library/react'
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

const preview = () => screen.getByLabelText('Context sent to the AI')
const facts = () => screen.findByRole('list', { name: 'Things you’ve told One Percent' })

describe('what One Percent knows about you', () => {
  it('shows each kind of context and exactly what is sent', async () => {
    renderRoutes(routes, { route: '/about-you' })

    expect(within(await facts()).getByText('I work night shifts')).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Habits it knows about' })).getByText('Read 10 pages')).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Themes it knows about' })).getByText('Self-doubt')).toBeInTheDocument()
    expect(preview().textContent).toContain('  • I work night shifts')
    expect(preview().textContent).toContain('often writes about: procrastination, self-doubt')
  })

  it('is linked from the account page', async () => {
    const { user, router } = renderRoutes(routes, { route: '/account' })

    await user.click(await screen.findByRole('link', { name: 'Open' }))

    expect(router.state.location.pathname).toBe('/about-you')
  })

  it('is linked from the feedback panel', async () => {
    const { user, router } = renderRoutes(routes, { route: '/journal/j1' })
    const feedback = await screen.findByRole('complementary', { name: 'Feedback' })

    await user.click(within(feedback).getByRole('link', { name: 'What the AI knows about you' }))

    expect(router.state.location.pathname).toBe('/about-you')
  })

  it('adds a fact, which then appears in what is sent', async () => {
    const { user } = renderRoutes(routes, { route: '/about-you' })
    await facts()

    await user.type(screen.getByLabelText('Add something about you'), '  Training for a  half marathon ')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(await within(await facts()).findByText('Training for a half marathon')).toBeInTheDocument()
    expect(screen.getByLabelText('Add something about you')).toHaveValue('')
    await waitFor(() => expect(preview().textContent).toContain('  • Training for a half marathon'))
  })

  it("keeps the text and shows the server's reason when a fact is refused", async () => {
    db.aiContext.facts = Array.from({ length: 19 }, (_, i) => ({ id: `f${i}`, text: `fact ${i}`, createdAt: '2026-11-01T09:00:00Z' }))
    server.use(
      http.post(`${API}/api/users/me/facts`, () =>
        new HttpResponse('You can keep up to 20 things here. Delete one to add another.', { status: 400 }),
      ),
    )
    const { user } = renderRoutes(routes, { route: '/about-you' })
    await facts()

    await user.type(screen.getByLabelText('Add something about you'), 'One too many')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByText(/up to 20 things/)).toBeInTheDocument()
    expect(screen.getByLabelText('Add something about you')).toHaveValue('One too many')
  })

  it('asks for text before sending an empty fact', async () => {
    const { user } = renderRoutes(routes, { route: '/about-you' })
    await facts()

    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByText('Write something to add.')).toBeInTheDocument()
    expect(db.aiContext.facts).toHaveLength(1)
  })

  it('hides the form once the list is full', async () => {
    db.aiContext.facts = Array.from({ length: 20 }, (_, i) => ({ id: `f${i}`, text: `fact ${i}`, createdAt: '2026-11-01T09:00:00Z' }))
    renderRoutes(routes, { route: '/about-you' })

    expect(await screen.findByText(/That’s the most it keeps \(20\)/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Add something about you')).not.toBeInTheDocument()
  })

  it('deletes a fact at once', async () => {
    const { user } = renderRoutes(routes, { route: '/about-you' })

    await user.click(within(await facts()).getByRole('button', { name: 'Delete “I work night shifts”' }))

    expect(await screen.findByText(/Nothing yet/)).toBeInTheDocument()
    expect(db.aiContext.facts).toHaveLength(0)
  })

  it('puts a fact back and says why if deleting fails', async () => {
    server.use(http.delete(`${API}/api/users/me/facts/:id`, () => HttpResponse.error()))
    const { user } = renderRoutes(routes, { route: '/about-you' })

    await user.click(within(await facts()).getByRole('button', { name: 'Delete “I work night shifts”' }))

    expect(await screen.findByText(/can't reach the one percent server/i)).toBeInTheDocument()
    expect(within(await facts()).getByText('I work night shifts')).toBeInTheDocument()
  })

  it('switching a kind of context off removes it from what is sent', async () => {
    const { user } = renderRoutes(routes, { route: '/about-you' })
    await facts()
    const themesSwitch = screen.getByRole('switch', { name: 'Use what you often write about' })
    expect(themesSwitch).toBeChecked()

    await user.click(themesSwitch)

    expect(screen.getByRole('switch', { name: 'Use what you often write about' })).not.toBeChecked()
    await waitFor(() => expect(preview().textContent).not.toContain('often writes about'))
    expect(db.aiContext.settings).toEqual({ useHabits: true, useThemes: false, useFacts: true, usePastAdvice: true })
  })

  it('flips a switch back if saving it fails', async () => {
    server.use(http.put(`${API}/api/users/me/ai-context/settings`, () => HttpResponse.error()))
    const { user } = renderRoutes(routes, { route: '/about-you' })
    await facts()

    await user.click(screen.getByRole('switch', { name: 'Use past advice' }))

    // the toast (and the app's connection notice) say why
    expect((await screen.findAllByText(/can't reach the one percent server/i)).length).toBeGreaterThan(0)
    expect(screen.getByRole('switch', { name: 'Use past advice' })).toBeChecked()
  })

  it('invites a first fact when there are none', async () => {
    db.aiContext.facts = []
    db.aiContext.habits = []
    renderRoutes(routes, { route: '/about-you' })

    expect(await screen.findByText(/Nothing yet/)).toBeInTheDocument()
    expect(screen.getByText('None this week.')).toBeInTheDocument()
  })

  it("shows a retry when the server can't be reached", async () => {
    server.use(http.get(`${API}/api/users/me/ai-context`, () => HttpResponse.error()))
    renderRoutes(routes, { route: '/about-you' })

    expect(await screen.findByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})
