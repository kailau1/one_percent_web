import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { routes } from '@/app/routes'
import type { JournalEntry } from '@/api/types'
import { signIn } from '@/test/auth'
import { db } from '@/test/msw/db'
import { API } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderRoutes } from '@/test/renderWithProviders'

/** Captures what downloadText hands to the browser instead of really downloading. */
function captureDownloads() {
  const files: { name: string; text: Promise<string> }[] = []
  let lastBlob: Blob | null = null
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    lastBlob = blob as Blob
    return 'blob:test'
  })
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    files.push({ name: this.download, text: lastBlob!.text() })
  })
  return files
}

beforeEach(() => {
  signIn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('exporting the whole journal (Account page)', () => {
  it('downloads every entry as one Markdown file, oldest first, with feedback', async () => {
    const files = captureDownloads()
    const { user } = renderRoutes(routes, { route: '/account' })

    await user.click(await screen.findByRole('button', { name: 'Download as Markdown' }))

    await waitFor(() => expect(files).toHaveLength(1))
    expect(files[0].name).toMatch(/^one-percent-journal-\d{4}-\d{2}-\d{2}\.md$/)
    const text = await files[0].text
    expect(text).toMatch(/^# One Percent journal/)
    expect(text).toContain(`${db.journals.length} entries`)
    // oldest first: October before November
    expect(text.indexOf('October thoughts')).toBeLessThan(text.indexOf('A slow start'))
    expect(text).toContain('> Notice how the run changed your morning.')
    expect(await screen.findByText(`Downloaded ${db.journals.length} entries`)).toBeInTheDocument()
  })

  it('fetches page after page, so long journals are complete', async () => {
    db.journals = Array.from({ length: 230 }, (_, i): JournalEntry => ({
      id: `e${i}`,
      title: `Entry ${i}`,
      content: `Text ${i}`,
      llmResponse: null,
      createdAt: new Date(Date.UTC(2026, 0, 1) + i * 3_600_000).toISOString(),
    }))
    const files = captureDownloads()
    const { user } = renderRoutes(routes, { route: '/account' })

    await user.click(await screen.findByRole('button', { name: 'Download as Markdown' }))

    await waitFor(() => expect(files).toHaveLength(1))
    const text = await files[0].text
    expect(text).toContain('230 entries')
    expect(text.match(/^## /gm)).toHaveLength(230)
    expect(text.indexOf('## Entry 0\n')).toBeLessThan(text.indexOf('## Entry 229\n'))
  })

  it('can leave the AI feedback out', async () => {
    const files = captureDownloads()
    const { user } = renderRoutes(routes, { route: '/account' })

    await user.click(await screen.findByRole('checkbox', { name: 'Include AI feedback' }))
    await user.click(screen.getByRole('button', { name: 'Download as Markdown' }))

    await waitFor(() => expect(files).toHaveLength(1))
    expect(await files[0].text).not.toContain('Feedback')
    expect(screen.getByRole('link', { name: 'Save as PDF' })).toHaveAttribute('href', '/print?feedback=0')
  })

  it("says so, and downloads nothing, when the server can't be reached", async () => {
    server.use(http.get(`${API}/api/journals`, () => HttpResponse.error()))
    const files = captureDownloads()
    const { user } = renderRoutes(routes, { route: '/account' })

    await user.click(await screen.findByRole('button', { name: 'Download as Markdown' }))

    expect(await screen.findByText(/can't reach the one percent server/i)).toBeInTheDocument()
    expect(files).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Download as Markdown' })).toBeEnabled()
  })

  it('has nothing to download for an empty journal', async () => {
    db.journals = []
    const files = captureDownloads()
    const { user } = renderRoutes(routes, { route: '/account' })

    await user.click(await screen.findByRole('button', { name: 'Download as Markdown' }))

    expect(await screen.findByText('There are no entries to export yet.')).toBeInTheDocument()
    expect(files).toHaveLength(0)
  })
})

describe('printable copy (Save as PDF)', () => {
  it('shows every entry, oldest first, with feedback, and prints on request', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    const { user } = renderRoutes(routes, { route: '/print?feedback=1' })

    const titles = await screen.findAllByRole('heading', { level: 1 })
    expect(titles.map((h) => h.textContent)).toEqual(['October thoughts', 'Good run', 'A slow start'])
    expect(screen.getByText('Try pairing it')).toBeInTheDocument()
    // no app chrome on the printed page
    expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Print or save as PDF' }))
    expect(print).toHaveBeenCalled()
  })

  it('leaves the feedback out when asked', async () => {
    renderRoutes(routes, { route: '/print?feedback=0' })

    await screen.findAllByRole('heading', { level: 1 })
    expect(screen.queryByText('Try pairing it')).not.toBeInTheDocument()
  })

  it('prints a single entry', async () => {
    renderRoutes(routes, { route: '/print?entry=j2' })

    expect(await screen.findByRole('heading', { level: 1, name: 'Good run' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('offers a retry when the entries fail to load', async () => {
    server.use(http.get(`${API}/api/journals`, () => HttpResponse.error(), { once: true }))
    const { user } = renderRoutes(routes, { route: '/print' })

    await user.click(await screen.findByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'A slow start' })).toBeInTheDocument()
  })
})

describe('exporting one entry (journal editor)', () => {
  it('downloads the entry as Markdown from the export menu', async () => {
    const files = captureDownloads()
    const { user } = renderRoutes(routes, { route: '/journal/j2' })

    await user.click(await screen.findByRole('button', { name: 'Export entry' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Download as Markdown' }))

    await waitFor(() => expect(files).toHaveLength(1))
    expect(files[0].name).toMatch(/^\d{4}-\d{2}-\d{2}-good-run\.md$/)
    const text = await files[0].text
    expect(text).toMatch(/^## Good run/)
    expect(text).toContain('> Notice how the run changed your morning.')
  })

  it('opens the printable copy of just that entry', async () => {
    const { user, router } = renderRoutes(routes, { route: '/journal/j2' })

    await user.click(await screen.findByRole('button', { name: 'Export entry' }))
    const menu = await screen.findByRole('menu')
    await user.click(within(menu).getByRole('menuitem', { name: 'Save as PDF' }))

    await waitFor(() => expect(router.state.location.pathname + router.state.location.search).toBe('/print?entry=j2'))
  })

  it('is not offered for an entry that has never been saved', async () => {
    renderRoutes(routes, { route: '/journal/new' })

    await screen.findByRole('textbox', { name: 'Entry' })
    expect(screen.queryByRole('button', { name: 'Export entry' })).not.toBeInTheDocument()
  })
})
