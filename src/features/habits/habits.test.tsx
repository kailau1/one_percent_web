import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { routes } from '@/app/routes'
import { signIn } from '@/test/auth'
import { db, dayKey } from '@/test/msw/db'
import { API } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderRoutes } from '@/test/renderWithProviders'

beforeEach(() => {
  signIn()
})

const habitList = () => screen.findByRole('list', { name: 'Your habits' })
const toggleFor = (name: string) => screen.getByRole('checkbox', { name: `${name}: done today` })

describe('habit list', () => {
  it('shows each habit, with trigger → action habits as a sentence', async () => {
    renderRoutes(routes, { route: '/habits' })

    const list = await habitList()
    expect(within(list).getByText('Read 10 pages')).toBeInTheDocument()
    expect(within(list).getByText('Before bed')).toBeInTheDocument()
    expect(within(list).getByText('When I pour my coffee, I will write one line')).toBeInTheDocument()
  })

  it('shows what is done today and overall progress', async () => {
    renderRoutes(routes, { route: '/habits' })
    await habitList()

    expect(toggleFor('Morning run')).toBeChecked()
    expect(toggleFor('Read 10 pages')).not.toBeChecked()
    expect(screen.getByText('1 of 3 done today')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Habits done today' })).toHaveAttribute('aria-valuenow', '1')
  })

  it('shows current streaks, keeping one alive when today is not done yet', async () => {
    renderRoutes(routes, { route: '/habits' })
    const list = await habitList()

    // h1: done the previous three days, not yet today
    expect(await within(list).findByText('3 days')).toBeInTheDocument()
    // h2: today and yesterday
    expect(within(list).getByText('2 days')).toBeInTheDocument()
  })

  it('invites a first habit when there are none', async () => {
    db.habits = []
    renderRoutes(routes, { route: '/habits' })

    expect(await screen.findByText('No habits yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add your first habit' })).toBeInTheDocument()
  })

  it("shows a retry when the server can't be reached, not an empty list", async () => {
    server.use(http.get(`${API}/api/habits/me`, () => HttpResponse.error(), { once: true }))
    const { user } = renderRoutes(routes, { route: '/habits' })

    expect(await screen.findByRole('alert')).toHaveTextContent(/can't reach/i)
    expect(screen.queryByText('No habits yet')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Read 10 pages')).toBeInTheDocument()
  })
})

describe('ticking a habit', () => {
  it('ticks it off, saves it and extends the streak straight away', async () => {
    const { user } = renderRoutes(routes, { route: '/habits' })
    const list = await habitList()
    await within(list).findByText('3 days')

    await user.click(toggleFor('Read 10 pages'))

    expect(toggleFor('Read 10 pages')).toBeChecked()
    expect(await screen.findByText('2 of 3 done today')).toBeInTheDocument()
    expect(await within(list).findByText('4 days')).toBeInTheDocument()
    await waitFor(() => expect(db.habits.find((h) => h.id === 'h1')!.completed).toBe(true))
    expect(db.history).toContainEqual({ habitId: 'h1', date: dayKey(0), completed: true })
  })

  it('un-ticks a habit', async () => {
    const { user } = renderRoutes(routes, { route: '/habits' })
    await habitList()

    await user.click(toggleFor('Morning run'))

    expect(toggleFor('Morning run')).not.toBeChecked()
    await waitFor(() => expect(db.habits.find((h) => h.id === 'h2')!.completed).toBe(false))
    // yesterday still counts until today is over
    expect(await screen.findByText('1 day')).toBeInTheDocument()
  })

  it('rolls the tick back and says why when the server is unreachable', async () => {
    server.use(http.post(`${API}/api/habit-history/complete/h1`, () => HttpResponse.error()))
    const { user } = renderRoutes(routes, { route: '/habits' })
    await habitList()

    await user.click(toggleFor('Read 10 pages'))

    expect(await screen.findByText(/can't reach the one percent server/i)).toBeInTheDocument()
    await waitFor(() => expect(toggleFor('Read 10 pages')).not.toBeChecked())
    expect(screen.getByText('1 of 3 done today')).toBeInTheDocument()
    expect(db.habits.find((h) => h.id === 'h1')!.completed).toBe(false)
  })

  it('can be toggled with the keyboard', async () => {
    const { user } = renderRoutes(routes, { route: '/habits' })
    await habitList()

    toggleFor('Read 10 pages').focus()
    await user.keyboard(' ')

    expect(toggleFor('Read 10 pages')).toBeChecked()
  })
})

describe('adding and editing habits', () => {
  it('adds a simple habit', async () => {
    const { user } = renderRoutes(routes, { route: '/habits' })
    await habitList()

    await user.click(screen.getByRole('button', { name: 'New habit' }))
    const dialog = await screen.findByRole('dialog', { name: 'New habit' })
    await user.type(within(dialog).getByLabelText('Habit'), 'Stretch')
    await user.click(within(dialog).getByRole('radio', { name: 'Mint' }))
    await user.click(within(dialog).getByRole('button', { name: 'Add habit' }))

    expect(await screen.findByText('Stretch')).toBeInTheDocument()
    expect(db.habits.at(-1)).toMatchObject({ habitName: 'Stretch', habitType: 'standard', colour: '#AAF0D1' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('adds a "when → then" habit and validates both halves', async () => {
    const { user } = renderRoutes(routes, { route: '/habits' })
    await habitList()

    await user.click(screen.getByRole('button', { name: 'New habit' }))
    const dialog = await screen.findByRole('dialog', { name: 'New habit' })
    await user.click(within(dialog).getByRole('radio', { name: /When → then/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Add habit' }))

    expect(await within(dialog).findByText('Say what sets it off')).toBeInTheDocument()
    expect(within(dialog).getByText('Say what you’ll do')).toBeInTheDocument()

    await user.type(within(dialog).getByLabelText('When I…'), 'close my laptop')
    await user.type(within(dialog).getByLabelText('I will…'), 'go for a walk')
    await user.click(within(dialog).getByRole('button', { name: 'Add habit' }))

    expect(await screen.findByText('When I close my laptop, I will go for a walk')).toBeInTheDocument()
    expect(db.habits.at(-1)).toMatchObject({ habitType: 'trigger-action', trigger: 'close my laptop', action: 'go for a walk' })
  })

  it('keeps the form open with the error when saving fails', async () => {
    server.use(http.post(`${API}/api/habits/create`, () => HttpResponse.error()))
    const { user } = renderRoutes(routes, { route: '/habits' })
    await habitList()

    await user.click(screen.getByRole('button', { name: 'New habit' }))
    const dialog = await screen.findByRole('dialog', { name: 'New habit' })
    await user.type(within(dialog).getByLabelText('Habit'), 'Stretch')
    await user.click(within(dialog).getByRole('button', { name: 'Add habit' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/can't reach/i)
    expect(within(dialog).getByLabelText('Habit')).toHaveValue('Stretch')
  })

  it('edits a habit without changing whether it is done today', async () => {
    const { user } = renderRoutes(routes, { route: '/habits' })
    await habitList()

    await user.click(screen.getByRole('button', { name: 'Morning run: details' }))
    await user.click(await screen.findByRole('button', { name: 'Edit' }))
    const dialog = await screen.findByRole('dialog', { name: 'Edit habit' })
    const name = within(dialog).getByLabelText('Habit')
    await user.clear(name)
    await user.type(name, 'Morning 5k')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(db.habits.find((h) => h.id === 'h2')).toMatchObject({ habitName: 'Morning 5k', completed: true }))
    expect(await screen.findByRole('checkbox', { name: 'Morning 5k: done today' })).toBeChecked()
  })
})

describe('habit details', () => {
  it('shows current and longest streaks and the history', async () => {
    const { user } = renderRoutes(routes, { route: '/habits' })
    await habitList()

    await user.click(screen.getByRole('button', { name: 'Read 10 pages: details' }))

    const drawer = await screen.findByRole('dialog', { name: 'Read 10 pages' })
    expect(await within(drawer).findByText('Current streak')).toBeInTheDocument()
    expect(within(drawer).getByText('Current streak').nextElementSibling).toHaveTextContent('3 days')
    expect(within(drawer).getByText('Longest streak').nextElementSibling).toHaveTextContent('3 days')
    expect(within(drawer).getByRole('img', { name: /Done on 4 of the last \d+ days/ })).toBeInTheDocument()
  })

  it('ticking in the drawer updates the streak there too', async () => {
    const { user } = renderRoutes(routes, { route: '/habits' })
    await habitList()
    await user.click(screen.getByRole('button', { name: 'Read 10 pages: details' }))
    const drawer = await screen.findByRole('dialog', { name: 'Read 10 pages' })
    await within(drawer).findByText('Current streak')

    await user.click(within(drawer).getByRole('checkbox', { name: 'Read 10 pages: done today' }))

    await waitFor(() => expect(within(drawer).getByText('Current streak').nextElementSibling).toHaveTextContent('4 days'))
    expect(within(drawer).getByText('Done today')).toBeInTheDocument()
  })

  it('deletes a habit after confirming', async () => {
    const { user } = renderRoutes(routes, { route: '/habits' })
    await habitList()
    await user.click(screen.getByRole('button', { name: 'Read 10 pages: details' }))
    await user.click(await screen.findByRole('button', { name: 'Delete' }))

    const confirm = await screen.findByRole('dialog', { name: 'Delete this habit?' })
    await user.click(within(confirm).getByRole('button', { name: 'Delete habit' }))

    await waitFor(() => expect(db.habits.some((h) => h.id === 'h1')).toBe(false))
    await waitFor(() => expect(screen.queryByText('Read 10 pages')).not.toBeInTheDocument())
  })
})
