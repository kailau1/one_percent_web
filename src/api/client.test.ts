import { http, HttpResponse } from 'msw'
import { API, server } from '@/test/msw/server'
import { ApiError, apiRequest, getErrorMessage, toApiError } from './client'
import { session } from './session'

/** Awaits a call that is expected to fail and returns the ApiError it threw. */
async function failureOf(request: Promise<unknown>): Promise<ApiError> {
  try {
    await request
  } catch (error) {
    return error as ApiError
  }
  throw new Error('expected the request to fail')
}

describe('apiRequest: success', () => {
  it('GETs from the configured server and parses JSON', async () => {
    server.use(http.get(`${API}/api/habits/me`, () => HttpResponse.json([{ id: 'h1' }])))

    await expect(apiRequest('/api/habits/me')).resolves.toEqual([{ id: 'h1' }])
  })

  it('attaches the stored login token', async () => {
    session.setToken('tok')
    let authorization: string | null = null
    server.use(
      http.get(`${API}/x`, ({ request }) => {
        authorization = request.headers.get('Authorization')
        return HttpResponse.json({})
      }),
    )

    await apiRequest('/x')

    expect(authorization).toBe('Bearer tok')
  })

  it('sends no token when auth is off (login, register)', async () => {
    session.setToken('stale')
    let authorization: string | null = 'unset'
    server.use(
      http.post(`${API}/api/users/login`, ({ request }) => {
        authorization = request.headers.get('Authorization')
        return HttpResponse.json({ token: 't' })
      }),
    )

    await apiRequest('/api/users/login', { method: 'POST', body: {}, auth: false })

    expect(authorization).toBeNull()
  })

  it('sends a JSON body', async () => {
    let received: unknown
    server.use(
      http.post(`${API}/x`, async ({ request }) => {
        received = await request.json()
        return HttpResponse.json({ ok: true })
      }),
    )

    await apiRequest('/x', { method: 'POST', body: { title: 'Hello' } })

    expect(received).toEqual({ title: 'Hello' })
  })

  it('returns undefined for an empty (204) response', async () => {
    server.use(http.delete(`${API}/x`, () => new HttpResponse(null, { status: 204 })))

    await expect(apiRequest('/x', { method: 'DELETE' })).resolves.toBeUndefined()
  })
})

describe('apiRequest: failures', () => {
  it('reports an unreachable server as an offline error', async () => {
    server.use(http.get(`${API}/x`, () => HttpResponse.error()))

    const error = await failureOf(apiRequest('/x'))

    expect(error).toBeInstanceOf(ApiError)
    expect(error.kind).toBe('network')
    expect(error.isOffline).toBe(true)
    expect(error.message).toMatch(/can't reach/i)
  })

  it('times out a request that never answers', async () => {
    server.use(http.get(`${API}/slow`, () => new Promise<never>(() => {})))

    const error = await failureOf(apiRequest('/slow', { timeoutMs: 30 }))

    expect(error.kind).toBe('timeout')
    expect(error.isOffline).toBe(true)
  })

  it.each([
    [401, 'unauthorized'],
    [403, 'unauthorized'],
    [404, 'notFound'],
    [409, 'badRequest'],
    [500, 'server'],
    [503, 'server'],
  ])('maps HTTP %i to %s', async (status, kind) => {
    server.use(http.get(`${API}/x`, () => new HttpResponse('oops', { status })))

    const error = await failureOf(apiRequest('/x'))

    expect(error.kind).toBe(kind)
    expect(error.status).toBe(status)
  })

  it("shows the server's reason for a 400", async () => {
    server.use(
      http.post(`${API}/api/users/register`, () =>
        new HttpResponse('An account with this email already exists.', { status: 400 }),
      ),
    )

    const error = await failureOf(apiRequest('/api/users/register', { method: 'POST', auth: false }))

    expect(error.message).toBe('An account with this email already exists.')
  })

  it("never shows a 500's body (it could be a stack trace) but keeps it for logging", async () => {
    server.use(http.get(`${API}/x`, () => new HttpResponse('NullPointerException at ...', { status: 500 })))

    const error = await failureOf(apiRequest('/x'))

    expect(error.message).not.toContain('NullPointerException')
    expect(error.detail).toBe('NullPointerException at ...')
  })

  it('treats an unreadable success body as a server error', async () => {
    server.use(http.get(`${API}/x`, () => new HttpResponse('not json')))

    await expect(apiRequest('/x')).rejects.toMatchObject({ kind: 'server' })
  })
})

describe('apiRequest: expired sessions', () => {
  afterEach(() => session.onExpired(null))

  it('announces an expired session when the server rejects our token', async () => {
    const expired = vi.fn()
    session.onExpired(expired)
    session.setToken('old-token')
    server.use(http.get(`${API}/api/journals/me`, () => new HttpResponse(null, { status: 401 })))

    await expect(apiRequest('/api/journals/me')).rejects.toMatchObject({ kind: 'unauthorized' })

    expect(expired).toHaveBeenCalledTimes(1)
  })

  it("doesn't treat a wrong password as an expired session", async () => {
    const expired = vi.fn()
    session.onExpired(expired)
    server.use(http.post(`${API}/api/users/login`, () => new HttpResponse(null, { status: 401 })))

    await expect(apiRequest('/api/users/login', { method: 'POST', auth: false })).rejects.toMatchObject({
      kind: 'unauthorized',
    })

    expect(expired).not.toHaveBeenCalled()
  })
})

describe('toApiError / getErrorMessage', () => {
  it('passes ApiErrors through unchanged', () => {
    const e = new ApiError('notFound')
    expect(toApiError(e)).toBe(e)
  })

  it('wraps anything else in a generic, user-safe error', () => {
    const wrapped = toApiError(new Error('undefined is not a function'))
    expect(wrapped.kind).toBe('unknown')
    expect(wrapped.message).toBe('Something went wrong. Try again.')
    expect(wrapped.detail).toBe('undefined is not a function')
    expect(getErrorMessage('boom')).toBe('Something went wrong. Try again.')
  })
})
