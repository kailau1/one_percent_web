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

const panel = () => screen.findByRole('complementary', { name: 'Feedback' })

describe('feedback on an entry', () => {
  it('shows feedback the entry already has, rendered from markdown', async () => {
    renderRoutes(routes, { route: '/journal/j2' })

    const feedback = await panel()
    expect(within(feedback).getByText('Try pairing it')).toContainHTML('<strong>Try pairing it</strong>')
    expect(within(feedback).getByRole('button', { name: 'Get fresh feedback' })).toBeInTheDocument()
  })

  it('requests feedback, shows progress, then the result, and it is saved on the entry', async () => {
    // the reply is held until the test has seen the progress state, so a busy machine can't skip past it
    let reply!: () => void
    const replied = new Promise<void>((resolve) => (reply = resolve))
    server.use(
      http.post(`${API}/api/ai/feedback`, async () => {
        await replied
        db.journals = db.journals.map((j) => (j.id === 'j1' ? { ...j, llmResponse: db.feedback } : j))
        return HttpResponse.json({ response: db.feedback })
      }),
    )
    const { user } = renderRoutes(routes, { route: '/journal/j1' })
    const feedback = await panel()

    await user.click(within(feedback).getByRole('button', { name: 'Get feedback' }))

    expect(await within(feedback).findByText(/Reading your entry/)).toBeInTheDocument()
    reply()
    expect(await within(feedback).findByText('two-minute rule')).toBeInTheDocument()
    expect(db.journals.find((j) => j.id === 'j1')!.llmResponse).toMatch(/two-minute rule/)
  })

  it('saves unsaved changes first, so the feedback is about what is on screen', async () => {
    const calls: string[] = []
    server.events.on('request:start', ({ request }) => {
      if (request.method !== 'GET') calls.push(`${request.method} ${new URL(request.url).pathname}`)
    })
    const { user } = renderRoutes(routes, { route: '/journal/j1' })
    await user.type(await screen.findByRole('textbox', { name: 'Entry' }), ' One more thing.')

    await user.click(within(await panel()).getByRole('button', { name: 'Save and get feedback' }))

    expect(await within(await panel()).findByText('two-minute rule')).toBeInTheDocument()
    expect(calls).toEqual(['PUT /api/journals/entry', 'POST /api/ai/feedback'])
    expect(db.journals.find((j) => j.id === 'j1')!.content).toMatch(/One more thing\.$/)
    server.events.removeAllListeners()
  })

  it('shows an error with a retry when feedback fails, and never stores the error as feedback', async () => {
    server.use(http.post(`${API}/api/ai/feedback`, () => HttpResponse.error(), { once: true }))
    const { user } = renderRoutes(routes, { route: '/journal/j1' })
    const feedback = await panel()

    await user.click(within(feedback).getByRole('button', { name: 'Get feedback' }))

    expect(await within(feedback).findByRole('alert')).toHaveTextContent(/can't reach/i)
    expect(db.journals.find((j) => j.id === 'j1')!.llmResponse).toBeNull()

    await user.click(within(feedback).getByRole('button', { name: 'Try again' }))

    expect(await within(feedback).findByText('two-minute rule')).toBeInTheDocument()
    expect(within(feedback).queryByRole('alert')).not.toBeInTheDocument()
  })

  it('saves a brand-new entry, then gets feedback on it', async () => {
    const { user, router } = renderRoutes(routes, { route: '/journal/new' })
    const feedback = await panel()
    expect(within(feedback).getByRole('button', { name: 'Save and get feedback' })).toBeDisabled()
    expect(within(feedback).getByText('Write something first.')).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: 'Entry' }), 'I kept avoiding the gym.')
    await user.click(within(feedback).getByRole('button', { name: 'Save and get feedback' }))

    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/journal\/j\d+$/))
    // search the page, not a panel captured earlier: the editor is replaced when the entry gets its own address
    expect(await screen.findByText('two-minute rule')).toBeInTheDocument()
    expect(db.journals.at(-1)).toMatchObject({ content: 'I kept avoiding the gym.', llmResponse: db.feedback })
  })
})

describe('writing prompts', () => {
  it("doesn't ask for prompts until you want them", async () => {
    let requested = false
    server.use(
      http.get(`${API}/api/ai/prompt`, () => {
        requested = true
        return HttpResponse.json(db.prompts)
      }),
    )
    renderRoutes(routes, { route: '/journal/new' })

    await screen.findByRole('button', { name: 'Suggest something to write about' })
    expect(requested).toBe(false)
  })

  it('suggests prompts and uses the one you pick as the title', async () => {
    const { user } = renderRoutes(routes, { route: '/journal/new' })

    await user.click(await screen.findByRole('button', { name: 'Suggest something to write about' }))
    await user.click(await screen.findByRole('button', { name: 'What drained you today?' }))

    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('What drained you today?')
    expect(screen.getByRole('textbox', { name: 'Entry' })).toHaveFocus()
    expect(screen.queryByRole('region', { name: 'Writing prompts' })).not.toBeInTheDocument()
  })

  it('offers a retry when prompts fail to load', async () => {
    server.use(http.get(`${API}/api/ai/prompt`, () => new HttpResponse(null, { status: 500 }), { once: true }))
    const { user } = renderRoutes(routes, { route: '/journal/new' })

    await user.click(await screen.findByRole('button', { name: 'Suggest something to write about' }))
    const prompts = await screen.findByRole('region', { name: 'Writing prompts' })
    expect(await within(prompts).findByRole('alert')).toHaveTextContent(/went wrong on the server/i)

    await user.click(within(prompts).getByRole('button', { name: 'Try again' }))

    expect(await within(prompts).findByRole('button', { name: 'What drained you today?' })).toBeInTheDocument()
  })

  it('is only offered on new entries', async () => {
    renderRoutes(routes, { route: '/journal/j1' })

    await screen.findByRole('textbox', { name: 'Title' })
    expect(screen.queryByRole('button', { name: 'Suggest something to write about' })).not.toBeInTheDocument()
  })
})

describe('tip of the day', () => {
  it('shows the tip on Today', async () => {
    renderRoutes(routes, { route: '/today' })

    expect(await screen.findByText(db.tip)).toBeInTheDocument()
  })

  it("remembers today's tip so a reload doesn't ask again", async () => {
    let requests = 0
    server.use(
      http.get(`${API}/api/ai/tip`, () => {
        requests++
        return HttpResponse.json({ response: db.tip })
      }),
    )
    const first = renderRoutes(routes, { route: '/today' })
    await screen.findByText(db.tip)
    first.unmount()

    renderRoutes(routes, { route: '/today' })

    expect(await screen.findByText(db.tip)).toBeInTheDocument()
    expect(requests).toBe(1)
  })

  it('offers a retry when the tip fails to load', async () => {
    server.use(http.get(`${API}/api/ai/tip`, () => HttpResponse.error(), { once: true }))
    const { user } = renderRoutes(routes, { route: '/today' })
    const tip = await screen.findByRole('region', { name: 'Tip of the day' })

    await user.click(await within(tip).findByRole('button', { name: 'Try again' }))

    expect(await within(tip).findByText(db.tip)).toBeInTheDocument()
  })
})
