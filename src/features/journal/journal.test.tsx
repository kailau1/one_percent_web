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

const list = () => screen.findByRole('navigation', { name: 'Entries' })
const path = (router: ReturnType<typeof renderRoutes>['router']) => router.state.location.pathname

describe('journal list', () => {
  it('shows entries newest first, grouped by month', async () => {
    renderRoutes(routes, { route: '/journal' })

    const entries = await list()
    const titles = within(entries).getAllByRole('link').map((link) => link.textContent)
    expect(titles[0]).toContain('A slow start')
    expect(titles[1]).toContain('Good run')
    expect(titles[2]).toContain('October thoughts')
    expect(within(entries).getByRole('heading', { name: 'November 2026' })).toBeInTheDocument()
    expect(within(entries).getByRole('heading', { name: 'October 2026' })).toBeInTheDocument()
  })

  it('filters by search across titles and text', async () => {
    const { user } = renderRoutes(routes, { route: '/journal' })
    await list()

    await user.type(screen.getByRole('searchbox', { name: 'Search entries' }), 'clear-headed')

    expect(screen.getByRole('link', { name: /Good run/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /A slow start/ })).not.toBeInTheDocument()

    await user.clear(screen.getByRole('searchbox'))
    await user.type(screen.getByRole('searchbox'), 'zebra')
    expect(screen.getByText(/No entries match “zebra”/)).toBeInTheDocument()
  })

  it('invites a first entry when the journal is empty', async () => {
    db.journals = []
    renderRoutes(routes, { route: '/journal' })

    expect(await screen.findByText('Your journal is empty')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Write your first entry' })).toHaveAttribute('href', '/journal/new')
  })

  it("shows a retry when the server can't be reached, and recovers", async () => {
    server.use(http.get(`${API}/api/journals/me`, () => HttpResponse.error(), { once: true }))
    const { user } = renderRoutes(routes, { route: '/journal' })

    expect(await screen.findByRole('alert')).toHaveTextContent(/can't reach/i)
    expect(screen.queryByText('Your journal is empty')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('link', { name: /A slow start/ })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('reading and editing an entry', () => {
  it('opens an entry from the list', async () => {
    const { user } = renderRoutes(routes, { route: '/journal' })

    await user.click(await screen.findByRole('link', { name: /Good run/ }))

    expect(await screen.findByRole('textbox', { name: 'Title' })).toHaveValue('Good run')
    expect(screen.getByRole('textbox', { name: 'Entry' })).toHaveValue('Ran 5k before work and felt clear-headed all morning.')
    expect(screen.getByText(/Tuesday 10 November 2026, 7:40 pm/)).toBeInTheDocument()
  })

  it('saves changes and keeps the existing AI feedback', async () => {
    const { user } = renderRoutes(routes, { route: '/journal/j2' })
    const entry = await screen.findByRole('textbox', { name: 'Entry' })
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()

    await user.type(entry, ' Felt great.')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(db.journals.find((j) => j.id === 'j2')!.content).toMatch(/Felt great\.$/))
    expect(db.journals.find((j) => j.id === 'j2')!.llmResponse).toMatch(/pairing it/)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled())
  })

  it('saves with Ctrl+S', async () => {
    const { user } = renderRoutes(routes, { route: '/journal/j1' })
    await user.type(await screen.findByRole('textbox', { name: 'Title' }), '!')

    await user.keyboard('{Control>}s{/Control}')

    await waitFor(() => expect(db.journals.find((j) => j.id === 'j1')!.title).toBe('A slow start!'))
  })

  it('keeps your text and offers a retry when saving fails', async () => {
    server.use(http.put(`${API}/api/journals/entry`, () => HttpResponse.error(), { once: true }))
    const { user } = renderRoutes(routes, { route: '/journal/j1' })
    const entry = await screen.findByRole('textbox', { name: 'Entry' })

    await user.type(entry, ' More thoughts.')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/can't reach/i)
    expect((entry as HTMLTextAreaElement).value).toMatch(/More thoughts\.$/)

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    await waitFor(() => expect(db.journals.find((j) => j.id === 'j1')!.content).toMatch(/More thoughts\.$/))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('restores unsaved writing when you come back to the entry', async () => {
    const first = renderRoutes(routes, { route: '/journal/j1' })
    await first.user.type(await screen.findByRole('textbox', { name: 'Entry' }), ' Unfinished thought')
    await waitFor(() => expect(localStorage.getItem('onepercent.draft.j1')).toMatch(/Unfinished thought/))
    first.unmount()

    const { user } = renderRoutes(routes, { route: '/journal/j1' })

    const restored = (await screen.findByRole('textbox', { name: 'Entry' })) as HTMLTextAreaElement
    expect(restored.value).toMatch(/Unfinished thought$/)
    expect(screen.getByText(/Restored what you were writing/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Discard it' }))

    expect(screen.getByRole('textbox', { name: 'Entry' })).toHaveValue(db.journals[0].content)
    expect(localStorage.getItem('onepercent.draft.j1')).toBeNull()
  })

  it('says so when the entry does not exist', async () => {
    renderRoutes(routes, { route: '/journal/does-not-exist' })

    expect(await screen.findByText('This entry doesn’t exist')).toBeInTheDocument()
  })
})

describe('writing a new entry', () => {
  it('creates the entry and opens it', async () => {
    const { user, router } = renderRoutes(routes, { route: '/journal/new' })
    const save = await screen.findByRole('button', { name: 'Save entry' })
    expect(save).toBeDisabled() // nothing written yet

    await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Fresh page')
    await user.type(screen.getByRole('textbox', { name: 'Entry' }), 'Today I started something new.')
    await user.click(save)

    await waitFor(() => expect(path(router)).toMatch(/^\/journal\/j\d+$/))
    expect(db.journals.at(-1)).toMatchObject({ title: 'Fresh page', content: 'Today I started something new.' })
    expect(await screen.findByRole('link', { name: /Fresh page/ })).toBeInTheDocument()
    expect(localStorage.getItem('onepercent.draft.new')).toBeNull()
  })

  it('keeps a new entry as a draft if saving fails', async () => {
    server.use(http.post(`${API}/api/journals`, () => new HttpResponse(null, { status: 500 })))
    const { user, router } = renderRoutes(routes, { route: '/journal/new' })

    await user.type(await screen.findByRole('textbox', { name: 'Entry' }), 'Do not lose me')
    await user.click(screen.getByRole('button', { name: 'Save entry' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/went wrong on the server/i)
    expect(path(router)).toBe('/journal/new')
    expect(screen.getByRole('textbox', { name: 'Entry' })).toHaveValue('Do not lose me')
    await waitFor(() => expect(localStorage.getItem('onepercent.draft.new')).toMatch(/Do not lose me/))
  })

  it('opens a new entry with the N key', async () => {
    const { user, router } = renderRoutes(routes, { route: '/journal' })
    await list()

    await user.keyboard('n')

    await waitFor(() => expect(path(router)).toBe('/journal/new'))
  })
})

describe('deleting an entry', () => {
  it('asks first, then deletes and returns to the list', async () => {
    const { user, router } = renderRoutes(routes, { route: '/journal/j1' })
    await user.click(await screen.findByRole('button', { name: 'Delete entry' }))

    const dialog = await screen.findByRole('dialog', { name: 'Delete this entry?' })
    await user.click(within(dialog).getByRole('button', { name: 'Delete entry' }))

    await waitFor(() => expect(path(router)).toBe('/journal'))
    expect(db.journals.some((j) => j.id === 'j1')).toBe(false)
    expect(screen.queryByRole('link', { name: /A slow start/ })).not.toBeInTheDocument()
  })

  it('does nothing if you choose to keep it', async () => {
    const { user } = renderRoutes(routes, { route: '/journal/j1' })
    await user.click(await screen.findByRole('button', { name: 'Delete entry' }))

    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Keep entry' }))

    expect(db.journals.some((j) => j.id === 'j1')).toBe(true)
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('A slow start')
  })
})
