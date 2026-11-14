import { http, HttpResponse, type RequestHandler } from 'msw'
import { makeToken, testUser } from '../auth'

export const API = 'http://api.test'

/** The password the fake backend accepts for any account. */
export const CORRECT_PASSWORD = 'correct-password'

/**
 * Default "happy path" responses for the real backend's routes. Each must match what
 * one_percent_spring actually returns (status codes and body shapes): a test that passes
 * against a wrong mock proves nothing. Override per test with server.use(...).
 */
export const handlers: RequestHandler[] = [
  // UserController.login: 200 { token } | 401 with an empty body
  http.post(`${API}/api/users/login`, async ({ request }) => {
    const { email, password } = (await request.json()) as { email: string; password: string }
    if (password !== CORRECT_PASSWORD) return new HttpResponse(null, { status: 401 })
    return HttpResponse.json({ token: makeToken({ email, sub: email }) })
  }),

  // UserController.createUser: 201 UserDTO | 400 plain-text reason
  http.post(`${API}/api/users/register`, async ({ request }) => {
    const body = (await request.json()) as { email: string; firstName: string; lastName: string }
    if (body.email === 'taken@example.com') {
      return new HttpResponse('An account with this email already exists.', { status: 400 })
    }
    return HttpResponse.json(
      { id: testUser.id, email: body.email, firstName: body.firstName, lastName: body.lastName },
      { status: 201 },
    )
  }),
]
