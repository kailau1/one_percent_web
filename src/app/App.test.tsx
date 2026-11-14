import { screen, within } from '@testing-library/react'
import { signIn } from '@/test/auth'
import { renderRoutes } from '@/test/renderWithProviders'
import { routes } from './routes'

describe('app shell', () => {
  beforeEach(() => {
    signIn()
  })

  it('opens on Today', async () => {
    renderRoutes(routes, { route: '/' })

    expect(await screen.findByRole('region', { name: 'Your year' })).toBeInTheDocument()
    expect(screen.getByText(/^Good (morning|afternoon|evening), Kai$|^Still up, Kai$/)).toBeInTheDocument()
  })

  it('navigates between sections from the sidebar and marks the current one', async () => {
    const { user } = renderRoutes(routes, { route: '/today' })
    const nav = screen.getAllByRole('navigation', { name: 'Main' })[0]

    await user.click(within(nav).getByRole('link', { name: 'Journal' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Journal' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Journal' })).toHaveAttribute('aria-current', 'page')

    await user.click(within(nav).getByRole('link', { name: 'Habits' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Habits' })).toBeInTheDocument()
  })

  it('shows a helpful page for unknown addresses', async () => {
    renderRoutes(routes, { route: '/nope' })

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to Today' })).toHaveAttribute('href', '/today')
  })

  it('switches between light and dark and remembers the choice', async () => {
    const { user } = renderRoutes(routes, { route: '/today' })

    await user.click(screen.getAllByRole('button', { name: 'Dark mode' })[0])

    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem('onepercent.theme')).toBe('dark')
    expect(screen.getAllByRole('button', { name: 'Light mode' })[0]).toBeInTheDocument()
  })

  it('warns when the browser goes offline', async () => {
    renderRoutes(routes, { route: '/today' })
    expect(screen.queryByText(/you're offline/i)).not.toBeInTheDocument()

    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    window.dispatchEvent(new Event('offline'))

    expect(await screen.findByText(/you're offline/i)).toBeInTheDocument()
    vi.restoreAllMocks()
  })
})
