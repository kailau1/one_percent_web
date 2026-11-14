import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { apiRequest } from '@/api/client'
import { session } from '@/api/session'
import { routes } from '@/app/routes'
import { makeToken, signIn } from '@/test/auth'
import { API, CORRECT_PASSWORD } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderRoutes } from '@/test/renderWithProviders'

const heading = (name: string) => screen.findByRole('heading', { level: 1, name })
/** The Today page, whose heading is the date. */
const todayPage = () => screen.findByRole('region', { name: 'Your year' })

describe('route protection', () => {
  it('sends a logged-out visitor to login and remembers where they were going', async () => {
    const { router } = renderRoutes(routes, { route: '/journal' })

    expect(await heading('Log in')).toBeInTheDocument()
    expect(router.state.location.pathname + router.state.location.search).toBe('/login?next=%2Fjournal')
  })

  it('keeps you logged in across a page refresh', async () => {
    signIn()
    renderRoutes(routes, { route: '/habits' })

    expect(await heading('Habits')).toBeInTheDocument()
  })

  it('treats an expired stored token as logged out and says why', async () => {
    session.setToken(makeToken({ exp: Math.floor(Date.now() / 1000) - 60 }))
    renderRoutes(routes, { route: '/today' })

    expect(await heading('Log in')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/session expired/i)
    expect(session.getToken()).toBeNull()
  })

  it('treats a tampered, unreadable token as logged out', async () => {
    session.setToken('definitely.not.valid')
    renderRoutes(routes, { route: '/today' })

    expect(await heading('Log in')).toBeInTheDocument()
  })

  it('logs you out when the server rejects the token mid-session', async () => {
    signIn()
    server.use(http.get(`${API}/api/journals/me`, () => new HttpResponse(null, { status: 401 })))
    renderRoutes(routes, { route: '/today' })
    await todayPage()

    await apiRequest('/api/journals/me').catch(() => {})

    expect(await heading('Log in')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/session expired/i)
    expect(session.getToken()).toBeNull()
  })

  it("doesn't show login to someone already logged in", async () => {
    signIn()
    renderRoutes(routes, { route: '/login' })

    expect(await todayPage()).toBeInTheDocument()
  })
})

describe('logging in', () => {
  async function fillAndSubmit(user: ReturnType<typeof renderRoutes>['user'], email: string, password: string) {
    await user.type(screen.getByLabelText('Email'), email)
    await user.type(screen.getByLabelText('Password'), password)
    await user.click(screen.getByRole('button', { name: 'Log in' }))
  }

  it('logs in and lands on the page you originally asked for', async () => {
    const { user } = renderRoutes(routes, { route: '/login?next=%2Fjournal' })
    await heading('Log in')

    await fillAndSubmit(user, 'kai@example.com', CORRECT_PASSWORD)

    expect(await heading('Journal')).toBeInTheDocument()
    expect(session.getToken()).not.toBeNull()
  })

  it('lands on Today by default', async () => {
    const { user } = renderRoutes(routes, { route: '/login' })
    await heading('Log in')

    await fillAndSubmit(user, 'kai@example.com', CORRECT_PASSWORD)

    expect(await todayPage()).toBeInTheDocument()
  })

  it('explains a wrong password without calling it an expired session', async () => {
    const { user } = renderRoutes(routes, { route: '/login' })
    await heading('Log in')

    await fillAndSubmit(user, 'kai@example.com', 'wrong')

    expect(await screen.findByRole('alert')).toHaveTextContent(/don’t match an account/i)
    expect(screen.queryByText(/session expired/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveValue('kai@example.com')
  })

  it("says so when the server can't be reached", async () => {
    server.use(http.post(`${API}/api/users/login`, () => HttpResponse.error()))
    const { user } = renderRoutes(routes, { route: '/login' })
    await heading('Log in')

    await fillAndSubmit(user, 'kai@example.com', CORRECT_PASSWORD)

    expect(await screen.findByRole('alert')).toHaveTextContent(/can't reach the one percent server/i)
  })

  it('validates before contacting the server', async () => {
    const { user } = renderRoutes(routes, { route: '/login' })
    await heading('Log in')

    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()
    expect(screen.getByText('Enter your password')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInvalid()
  })
})

describe('signing up', () => {
  async function fill(user: ReturnType<typeof renderRoutes>['user'], email: string, password = 'a-good-password') {
    await user.type(screen.getByLabelText('First name'), 'Kai')
    await user.type(screen.getByLabelText('Last name'), 'Lau')
    await user.type(screen.getByLabelText('Email'), email)
    await user.type(screen.getByLabelText('Password'), password)
    await user.click(screen.getByRole('button', { name: 'Create account' }))
  }

  it('creates the account and logs straight in', async () => {
    // the fake login accepts one password; make registration's follow-up login succeed with ours
    server.use(http.post(`${API}/api/users/login`, () => HttpResponse.json({ token: makeToken() })))
    const { user } = renderRoutes(routes, { route: '/signup' })
    await heading('Create your account')

    await fill(user, 'new@example.com')

    expect(await todayPage()).toBeInTheDocument()
    expect(session.getToken()).not.toBeNull()
  })

  it('shows "email already exists" next to the email field', async () => {
    const { user } = renderRoutes(routes, { route: '/signup' })
    await heading('Create your account')

    await fill(user, 'taken@example.com')

    expect(await screen.findByText('An account with this email already exists.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInvalid()
    expect(screen.getByLabelText('First name')).toHaveValue('Kai')
  })

  it('requires a password of at least 8 characters', async () => {
    const { user } = renderRoutes(routes, { route: '/signup' })
    await heading('Create your account')

    await fill(user, 'new@example.com', 'short')

    expect(await screen.findByText('Use at least 8 characters')).toBeInTheDocument()
  })
})

describe('account page', () => {
  it('shows who is logged in and logs out', async () => {
    signIn()
    const { user, router } = renderRoutes(routes, { route: '/account' })

    expect(await screen.findByText('Kai Lau')).toBeInTheDocument()
    expect(screen.getByText('kai@example.com')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Log out' }))

    expect(await heading('Log in')).toBeInTheDocument()
    expect(session.getToken()).toBeNull()
    expect(screen.queryByText(/session expired/i)).not.toBeInTheDocument()
    // a clean login page, not "come back to /account"
    expect(router.state.location.pathname + router.state.location.search).toBe('/login')
    await waitFor(() => expect(localStorage.getItem('onepercent.token')).toBeNull())
  })
})
