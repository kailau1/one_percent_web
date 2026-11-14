import { http, HttpResponse, type RequestHandler } from 'msw'
import type { JournalEntry } from '@/api/types'
import { makeToken, testUser } from '../auth'
import { db, newId } from './db'

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

  // JournalController. Every route answers 401 without a token on the real server; tests that
  // care about that override the route. Not-yours and not-found are both 404 with a text body.
  http.get(`${API}/api/journals/me`, () => HttpResponse.json(db.journals)),

  http.post(`${API}/api/journals`, async ({ request }) => {
    const body = (await request.json()) as Partial<JournalEntry>
    const created: JournalEntry = {
      id: newId('j'),
      title: body.title ?? '',
      content: body.content ?? '',
      llmResponse: body.llmResponse ?? null,
      createdAt: '2026-11-14T09:30:00.5',
    }
    db.journals = [...db.journals, created]
    return HttpResponse.json(created)
  }),

  http.put(`${API}/api/journals/entry`, async ({ request }) => {
    const body = (await request.json()) as JournalEntry
    const existing = db.journals.find((j) => j.id === body.id)
    if (!existing) return new HttpResponse(`Journal entry not found: ${body.id}`, { status: 404 })
    // like the real service: title, content and llmResponse are all overwritten
    const updated = { ...existing, title: body.title, content: body.content, llmResponse: body.llmResponse ?? null }
    db.journals = db.journals.map((j) => (j.id === updated.id ? updated : j))
    return HttpResponse.json(updated)
  }),

  http.delete(`${API}/api/journals/:id`, ({ params }) => {
    if (!db.journals.some((j) => j.id === params.id)) {
      return new HttpResponse(`Journal entry not found: ${params.id}`, { status: 404 })
    }
    db.journals = db.journals.filter((j) => j.id !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),

  // AiController.getAiFeedback: 200 { response }. For a saved entry the server reads the stored
  // text and stores the feedback on the entry; 404 if the entry isn't yours.
  http.post(`${API}/api/ai/feedback`, async ({ request }) => {
    const { journalId } = (await request.json()) as { journalId?: string | null }
    if (journalId) {
      if (!db.journals.some((j) => j.id === journalId)) {
        return new HttpResponse(`Journal entry not found: ${journalId}`, { status: 404 })
      }
      db.journals = db.journals.map((j) => (j.id === journalId ? { ...j, llmResponse: db.feedback } : j))
    }
    return HttpResponse.json({ response: db.feedback })
  }),

  // PromptController.getMyPrompts: 200 string[]
  http.get(`${API}/api/ai/prompt`, () => HttpResponse.json(db.prompts)),

  // AiController.getTipOfTheDay: 200 { response }
  http.get(`${API}/api/ai/tip`, () => HttpResponse.json({ response: db.tip })),
]
