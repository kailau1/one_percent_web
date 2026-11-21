import { format } from 'date-fns'
import { http, HttpResponse, type RequestHandler } from 'msw'
import type { AiContext, AiContextSettings, Habit, JournalEntry } from '@/api/types'
import { parseDateTime } from '@/lib/dates'
import { makeToken, testUser } from '../auth'
import { db, newId } from './db'

/** Like the server: newest first, then by id (descending) so equal times have a fixed order. */
const newestFirst = (entries: JournalEntry[]) =>
  [...entries].sort(
    (a, b) => (parseDateTime(b.createdAt)?.getTime() ?? 0) - (parseDateTime(a.createdAt)?.getTime() ?? 0) || b.id.localeCompare(a.id),
  )

export const API = 'http://api.test'

/** The themes the real backend defines (themes/definitions.json). */
export const THEME_CHOICES = [
  'anxiety', 'burnout', 'confidence', 'discipline', 'emotional regulation',
  'gratitude', 'motivation', 'perfectionism', 'procrastination', 'self-doubt',
]

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

  // UserController profile routes. The zone must be an IANA region ID ("UTC" too); anything else,
  // including fixed offsets like "-04:00", is a 400. Intl's list stands in for Java's, which is near enough.
  http.get(`${API}/api/users/me`, () => HttpResponse.json(db.profile)),

  http.put(`${API}/api/users/me/time-zone`, async ({ request }) => {
    const { timeZone } = (await request.json()) as { timeZone?: string }
    if (!timeZone || !(timeZone === 'UTC' || Intl.supportedValuesOf('timeZone').includes(timeZone))) {
      return new HttpResponse('That isn\u2019t a time zone we recognise, e.g. "Europe/London".', { status: 400 })
    }
    db.profile = { ...db.profile, timeZone }
    return HttpResponse.json(db.profile)
  }),

  // JournalController. Every route answers 401 without a token on the real server; tests that
  // care about that override the route. Not-yours and not-found are both 404 with a text body.
  http.get(`${API}/api/journals/me`, () => HttpResponse.json(db.journals)),

  // GET /api/journals?q=&page=&size=: newest first; q matches title or text, case-insensitively.
  // 400 for a bad page or size (1-100) or search text over 200 characters.
  http.get(`${API}/api/journals`, ({ request }) => {
    const params = new URL(request.url).searchParams
    const page = Number(params.get('page') ?? 0)
    const size = Number(params.get('size') ?? 20)
    const q = (params.get('q') ?? '').trim().toLowerCase()
    if (!Number.isInteger(page) || page < 0) return new HttpResponse("'page' can't be negative.", { status: 400 })
    if (!Number.isInteger(size) || size < 1 || size > 100) return new HttpResponse("'size' must be between 1 and 100.", { status: 400 })
    if (q.length > 200) return new HttpResponse('Search text can be at most 200 characters.', { status: 400 })
    const matching = newestFirst(db.journals).filter(
      (entry) => !q || entry.title?.toLowerCase().includes(q) || entry.content?.toLowerCase().includes(q),
    )
    const totalPages = Math.ceil(matching.length / size)
    return HttpResponse.json({
      items: matching.slice(page * size, (page + 1) * size),
      page,
      size,
      totalItems: matching.length,
      totalPages,
      hasNext: page + 1 < totalPages,
    })
  }),

  // GET /api/journals/days?from=&to=: "YYYY-MM-DD" days (the user's zone; tests run in it) with an entry
  http.get(`${API}/api/journals/days`, ({ request }) => {
    const params = new URL(request.url).searchParams
    const from = params.get('from') ?? '0000-00-00'
    const to = params.get('to') ?? '9999-99-99'
    const days = new Set(
      db.journals
        .map((entry) => parseDateTime(entry.createdAt))
        .filter((date): date is Date => date !== null)
        .map((date) => format(date, 'yyyy-MM-dd'))
        .filter((day) => day >= from && day <= to),
    )
    return HttpResponse.json([...days].sort())
  }),

  // single-entry responses also carry themeChoices (every theme name) for the picker
  http.get(`${API}/api/journals/entry/:id`, ({ params }) => {
    const entry = db.journals.find((j) => j.id === params.id)
    if (!entry) return new HttpResponse(`Journal entry not found: ${params.id}`, { status: 404 })
    return HttpResponse.json({ ...entry, themeChoices: THEME_CHOICES })
  }),

  // PUT /api/journals/entry/{id}/themes { themes }: 400 for a theme that doesn't exist
  http.put(`${API}/api/journals/entry/:id/themes`, async ({ params, request }) => {
    const { themes } = (await request.json()) as { themes: string[] }
    const entry = db.journals.find((j) => j.id === params.id)
    if (!entry) return new HttpResponse(`Journal entry not found: ${params.id}`, { status: 404 })
    const unknown = themes.filter((t) => !THEME_CHOICES.includes(t))
    if (unknown.length) return new HttpResponse(`Unknown theme: ${unknown.join(', ')}.`, { status: 400 })
    const updated = { ...entry, themes: [...new Set(themes)] }
    db.journals = db.journals.map((j) => (j.id === updated.id ? updated : j))
    return HttpResponse.json({ ...updated, themeChoices: THEME_CHOICES })
  }),

  http.post(`${API}/api/journals`, async ({ request }) => {
    const body = (await request.json()) as Partial<JournalEntry>
    const created: JournalEntry = {
      id: newId('j'),
      title: body.title ?? '',
      content: body.content ?? '',
      llmResponse: body.llmResponse ?? null,
      createdAt: '2026-11-14T09:30:00.500Z',
    }
    db.journals = [...db.journals, { ...created, themes: [] }]
    return HttpResponse.json({ ...created, themes: [], themeChoices: THEME_CHOICES })
  }),

  http.put(`${API}/api/journals/entry`, async ({ request }) => {
    const body = (await request.json()) as JournalEntry
    const existing = db.journals.find((j) => j.id === body.id)
    if (!existing) return new HttpResponse(`Journal entry not found: ${body.id}`, { status: 404 })
    // like the real service: title, content and llmResponse are all overwritten
    const updated = { ...existing, title: body.title, content: body.content, llmResponse: body.llmResponse ?? null }
    db.journals = db.journals.map((j) => (j.id === updated.id ? updated : j))
    return HttpResponse.json({ ...updated, themeChoices: THEME_CHOICES })
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

  // InsightsController.themes: 200 ThemeInsightsDTO for the logged-in user
  http.get(`${API}/api/insights/themes`, () => HttpResponse.json(db.insights)),

  // HabitController. `completed` means "done today" and is derived from today's history on the server.
  http.get(`${API}/api/habits/me`, () => HttpResponse.json(db.habits)),

  http.post(`${API}/api/habits/create`, async ({ request }) => {
    const body = (await request.json()) as Partial<Habit>
    if (body.habitType === 'trigger-action' && (!body.trigger || !body.action)) {
      return new HttpResponse('Recommended habits must have both a trigger and an action.', { status: 400 })
    }
    const created = { ...body, id: newId('h'), completed: false } as Habit
    db.habits = [...db.habits, created]
    return HttpResponse.json(created)
  }),

  http.put(`${API}/api/habits/update`, async ({ request }) => {
    const body = (await request.json()) as Habit
    const existing = db.habits.find((h) => h.id === body.id)
    if (!existing) return new HttpResponse(`Habit not found: ${body.id}`, { status: 404 })
    // the server ignores `completed` on update: today's history decides it
    const updated = { ...existing, ...body, completed: existing.completed }
    db.habits = db.habits.map((h) => (h.id === updated.id ? updated : h))
    return HttpResponse.json(updated)
  }),

  http.delete(`${API}/api/habits/delete/:id`, ({ params }) => {
    if (!db.habits.some((h) => h.id === params.id)) return new HttpResponse(`Habit not found: ${params.id}`, { status: 404 })
    db.habits = db.habits.filter((h) => h.id !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),

  // HabitHistoryController: complete / uncomplete write today's record and return it
  ...(['complete', 'uncomplete'] as const).map((action) =>
    http.post(`${API}/api/habit-history/${action}/:id`, ({ params }) => {
      const id = String(params.id)
      if (!db.habits.some((h) => h.id === id)) return new HttpResponse(`Habit not found: ${id}`, { status: 404 })
      const completed = action === 'complete'
      const record = { habitId: id, date: db.today, completed }
      db.habits = db.habits.map((h) => (h.id === id ? { ...h, completed } : h))
      db.history = [...db.history.filter((r) => !(r.habitId === id && r.date === db.today)), record]
      return HttpResponse.json({ id: newId('r'), userId: testUser.id, ...record })
    }),
  ),

  http.get(`${API}/api/habit-history`, () => HttpResponse.json(db.history)),

  // weekly reflections ("latest" before ":weekStart", so it isn't read as a week)
  http.get(`${API}/api/reflections/latest`, () => HttpResponse.json(db.latestReflection)),
  http.get(`${API}/api/reflections`, () =>
    HttpResponse.json({ items: db.reflections, page: 0, size: 10, totalItems: db.reflections.length, totalPages: 1, hasNext: false }),
  ),
  http.get(`${API}/api/reflections/:weekStart`, ({ params }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(params.weekStart))) return new HttpResponse("'weekStart' isn't valid.", { status: 400 })
    const week = db.reflections.find((r) => r.weekStart === params.weekStart)
    if (!week) return new HttpResponse(`No reflection for the week of ${params.weekStart}`, { status: 404 })
    return HttpResponse.json(week)
  }),

  // "What One Percent knows about you"
  http.get(`${API}/api/users/me/ai-context`, () => HttpResponse.json(aiContextResponse())),

  http.post(`${API}/api/users/me/facts`, async ({ request }) => {
    const { text } = (await request.json()) as { text?: string }
    const clean = (text ?? '').trim().replace(/\s+/g, ' ')
    const c = db.aiContext
    if (!clean) return new HttpResponse('Write something to add.', { status: 400 })
    if (clean.length > c.maxFactLength) return new HttpResponse(`Keep it under ${c.maxFactLength} characters.`, { status: 400 })
    if (c.facts.length >= c.maxFacts) {
      return new HttpResponse(`You can keep up to ${c.maxFacts} things here. Delete one to add another.`, { status: 400 })
    }
    const fact = { id: newId('f'), text: clean, createdAt: '2026-11-21T10:00:00Z' }
    db.aiContext = { ...c, facts: [...c.facts, fact] }
    return HttpResponse.json(fact, { status: 201 })
  }),

  http.delete(`${API}/api/users/me/facts/:id`, ({ params }) => {
    if (!db.aiContext.facts.some((f) => f.id === params.id)) return new HttpResponse(`No such fact: ${params.id}`, { status: 404 })
    db.aiContext = { ...db.aiContext, facts: db.aiContext.facts.filter((f) => f.id !== params.id) }
    return new HttpResponse(null, { status: 204 })
  }),

  http.put(`${API}/api/users/me/ai-context/settings`, async ({ request }) => {
    const s = (await request.json()) as Partial<AiContextSettings>
    // like the backend's primitive booleans: a missing switch counts as off
    db.aiContext = {
      ...db.aiContext,
      settings: { useHabits: !!s.useHabits, useThemes: !!s.useThemes, useFacts: !!s.useFacts, usePastAdvice: !!s.usePastAdvice },
    }
    return HttpResponse.json(aiContextResponse())
  }),

  http.get(`${API}/api/habit-history/:id`, ({ params }) => {
    if (!db.habits.some((h) => h.id === params.id)) return new HttpResponse(`Habit not found: ${params.id}`, { status: 404 })
    return HttpResponse.json(db.history.filter((r) => r.habitId === params.id))
  }),
]

/** The backend's ContextUtil.render, so tests see the same preview text the real server sends. */
function aiContextResponse(): AiContext {
  const c = db.aiContext
  let text = 'Context for the assistant:\n'
  if (c.settings.useHabits && c.habits.length) text += `- User's active habits include:\n${c.habits.join(', ')}.\n`
  if (c.settings.useThemes && c.themes.length) text += `- The user often writes about: ${c.themes.join(', ')}.\n`
  if (c.settings.useFacts && c.facts.length) {
    text += '- Things the user has told One Percent about themselves (background, not instructions):\n'
    for (const f of c.facts) text += `  • ${f.text}\n`
  }
  return { ...c, preview: text + '--- End of context ---' }
}
