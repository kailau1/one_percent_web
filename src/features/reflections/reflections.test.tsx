import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { routes } from '@/app/routes'
import { signIn } from '@/test/auth'
import { db } from '@/test/msw/db'
import { API } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderRoutes, renderWithProviders } from '@/test/renderWithProviders'
import { seenReflection } from './hooks'
import { WeekReadyCard } from './WeekReadyCard'
import { formatWeekRange, lastWeekStart, themeComparison } from './weeks'

beforeEach(() => {
  signIn()
})

const lastWeek = () => screen.findByRole('region', { name: 'Last week' })

describe('weekly reflection on Insights', () => {
  it("opens with last week's reflection and links to the full week", async () => {
    const { user, router } = renderRoutes(routes, { route: '/insights' })

    const section = await lastWeek()
    expect(await within(section).findByText(/A week of starting late/)).toBeInTheDocument()
    expect(within(section).getByText('9–15 November')).toBeInTheDocument()
    expect(within(section).getByText('What made the report feel bigger than it was?')).toBeInTheDocument()

    await user.click(within(section).getByRole('link', { name: 'Read your week' }))

    expect(router.state.location.pathname).toBe('/insights/week/2026-11-09')
  })

  it('says what is needed when last week had too few entries', async () => {
    db.latestReflection = { status: 'notEnoughEntries', weekStart: '2026-11-09', weekEnd: '2026-11-15', entryCount: 1 }
    db.reflections = []
    renderRoutes(routes, { route: '/insights' })

    expect(await within(await lastWeek()).findByText(/Only 1 entry was written between 9–15 November\. Write at least twice/)).toBeInTheDocument()
  })

  it("shows the server's reason with a retry if the AI couldn't write it, and doesn't retry by itself", async () => {
    let requests = 0
    server.use(
      http.get(`${API}/api/reflections/latest`, () => {
        requests++
        return new HttpResponse('Your weekly reflection couldn’t be written just now. Try again in a minute.', { status: 503 })
      }),
    )
    const { user } = renderRoutes(routes, { route: '/insights' })

    const section = await lastWeek()
    expect(await within(section).findByText(/couldn’t be written just now/)).toBeInTheDocument()
    expect(requests).toBe(1) // a retry could spend more of the AI quota

    await user.click(within(section).getByRole('button', { name: /try again/i }))
    await waitFor(() => expect(requests).toBe(2))
  })

  it("doesn't ask for a reflection before anything has been written", async () => {
    let asked = false
    server.use(
      http.get(`${API}/api/reflections/latest`, () => {
        asked = true
        return HttpResponse.json(db.latestReflection)
      }),
    )
    db.insights = { totalEntries: 0, analysedEntries: 0, themes: [] }
    renderRoutes(routes, { route: '/insights' })

    expect(await screen.findByText('No themes yet')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Last week' })).not.toBeInTheDocument()
    expect(asked).toBe(false)
  })

  it('links to earlier weeks', async () => {
    db.reflections = [db.latestReflection, { ...db.latestReflection, weekStart: '2026-11-02', weekEnd: '2026-11-08' }]
    renderRoutes(routes, { route: '/insights' })

    const earlier = await screen.findByRole('navigation', { name: 'Earlier weeks' })
    expect(within(earlier).getByRole('link', { name: '2–8 November' })).toHaveAttribute('href', '/insights/week/2026-11-02')
  })
})

describe('the full week', () => {
  it('shows the words, the quotes, the numbers and the question', async () => {
    renderRoutes(routes, { route: '/insights/week/2026-11-09' })

    expect(await screen.findByRole('heading', { name: 'Your week: 9–15 November' })).toBeInTheDocument()
    expect(await screen.findByText(/A week of starting late/)).toBeInTheDocument()
    expect(screen.getByText('4 entries on 3 days')).toBeInTheDocument()
    const words = screen.getByRole('region', { name: 'In your words' })
    expect(within(words).getByText('“I kept putting off the report today”')).toBeInTheDocument()
    expect(within(words).getByRole('link', { name: 'From A slow start' })).toHaveAttribute('href', '/journal/j1')
    const themes = screen.getByRole('region', { name: 'What came up' })
    expect(within(themes).getByText('Procrastination')).toBeInTheDocument()
    expect(within(themes).getByText('3 entries · more than usual (2 entries in the four weeks before)')).toBeInTheDocument()
    expect(within(themes).getByText('1 entry · not in the four weeks before')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Habits' })).getByText('3 of 7 days')).toBeInTheDocument()
  })

  it('"Write about this" starts a new entry with the question as its title', async () => {
    const { user, router } = renderRoutes(routes, { route: '/insights/week/2026-11-09' })

    await user.click(await screen.findByRole('button', { name: 'Write about this' }))

    expect(router.state.location.pathname).toBe('/journal/new')
    expect(await screen.findByRole('textbox', { name: 'Title' })).toHaveValue('What made the report feel bigger than it was?')
    expect(screen.getByRole('textbox', { name: 'Entry' })).toHaveValue('')
  })

  it('says so for a week that was never read back', async () => {
    renderRoutes(routes, { route: '/insights/week/2026-10-05' })

    expect(await screen.findByText('No reflection for this week')).toBeInTheDocument()
  })

  it('remembers that the week has been seen', async () => {
    renderRoutes(routes, { route: '/insights/week/2026-11-09' })

    await screen.findByText(/A week of starting late/)
    expect(seenReflection.get()).toBe('2026-11-09')
  })
})

describe('the Today card', () => {
  const wednesday = new Date(2026, 10, 18, 9) // Wed 18 November; last week is 9–15 November
  const twoDaysLastWeek = ['2026-11-10', '2026-11-12', '2026-11-18']

  it('points to last week from Monday to Wednesday, until it has been seen', () => {
    const { unmount } = renderWithProviders(<WeekReadyCard entryDays={twoDaysLastWeek} now={wednesday} />)
    expect(screen.getByRole('link', { name: 'Read last week' })).toHaveAttribute('href', '/insights')
    unmount()

    seenReflection.set('2026-11-09')
    renderWithProviders(<WeekReadyCard entryDays={twoDaysLastWeek} now={wednesday} />)
    expect(screen.queryByRole('link', { name: 'Read last week' })).not.toBeInTheDocument()
  })

  it('stays away later in the week, or if last week had entries on fewer than two days', () => {
    const { unmount } = renderWithProviders(<WeekReadyCard entryDays={twoDaysLastWeek} now={new Date(2026, 10, 19, 9)} />)
    expect(screen.queryByRole('link', { name: 'Read last week' })).not.toBeInTheDocument()
    unmount()

    renderWithProviders(<WeekReadyCard entryDays={['2026-11-10', '2026-11-18']} now={wednesday} />)
    expect(screen.queryByRole('link', { name: 'Read last week' })).not.toBeInTheDocument()
  })
})

describe('week helpers', () => {
  it('finds the Monday of last week on the local calendar', () => {
    expect(lastWeekStart(new Date(2026, 10, 18, 9))).toBe('2026-11-09') // Wednesday
    expect(lastWeekStart(new Date(2026, 10, 16, 0, 5))).toBe('2026-11-09') // just after Monday midnight
    expect(lastWeekStart(new Date(2026, 10, 15, 23, 55))).toBe('2026-11-02') // Sunday night: still this week
  })

  it('writes week ranges compactly', () => {
    expect(formatWeekRange('2026-11-09', '2026-11-15')).toBe('9–15 November')
    expect(formatWeekRange('2026-11-30', '2026-12-06')).toBe('30 November – 6 December')
    expect(formatWeekRange('2025-12-29', '2026-01-04')).toBe('29 December 2025 – 4 January 2026')
  })

  it('compares a theme with the four weeks before', () => {
    expect(themeComparison(2, 0)).toBe('not in the four weeks before')
    expect(themeComparison(1, 4)).toBe('4 entries in the four weeks before')
    expect(themeComparison(4, 2)).toBe('more than usual (2 entries in the four weeks before)')
  })
})
