import type { JournalEntry } from '@/api/types'
import { entryFileName, entryToMarkdown, journalFileName, journalToMarkdown } from './markdown'

// Tests run in Europe/London; 09:30 UTC on 14 Nov is 09:30 in London (GMT).
const entry = (overrides: Partial<JournalEntry> = {}): JournalEntry => ({
  id: 'j1',
  title: 'A slow start',
  content: 'I kept putting off the report.\n\nThen I started.',
  llmResponse: 'Try the **two-minute rule**.\n\nStart tiny.',
  createdAt: '2026-11-14T09:30:00Z',
  ...overrides,
})

describe('entryToMarkdown', () => {
  it('writes the title, the date and the text', () => {
    expect(entryToMarkdown(entry(), { includeFeedback: false })).toBe(
      '## A slow start\n\n*Saturday 14 November 2026, 9:30 am*\n\nI kept putting off the report.\n\nThen I started.',
    )
  })

  it('adds the feedback as a quote when asked, keeping its paragraphs', () => {
    expect(entryToMarkdown(entry(), { includeFeedback: true })).toContain(
      '**Feedback**\n\n> Try the **two-minute rule**.\n>\n> Start tiny.',
    )
  })

  it('leaves out the feedback section when there is none', () => {
    expect(entryToMarkdown(entry({ llmResponse: null }), { includeFeedback: true })).not.toContain('Feedback')
    expect(entryToMarkdown(entry({ llmResponse: '   ' }), { includeFeedback: true })).not.toContain('Feedback')
  })

  it('names untitled entries and copes with a missing date', () => {
    const markdown = entryToMarkdown(entry({ title: '  ', createdAt: '' }), { includeFeedback: false })
    expect(markdown.startsWith('## Untitled\n\nI kept')).toBe(true)
  })
})

describe('journalToMarkdown', () => {
  it('puts a heading first, then every entry in the order given, separated by rules', () => {
    const markdown = journalToMarkdown(
      [entry({ id: 'a', title: 'First' }), entry({ id: 'b', title: 'Second' })],
      { includeFeedback: false },
      new Date(2026, 10, 21),
    )
    expect(markdown.startsWith('# One Percent journal\n\nExported Saturday 21 November 2026. 2 entries.\n\n---\n\n## First')).toBe(true)
    expect(markdown.indexOf('## First')).toBeLessThan(markdown.indexOf('## Second'))
    expect(markdown.endsWith('\n')).toBe(true)
  })

  it('says "1 entry" for one', () => {
    expect(journalToMarkdown([entry()], { includeFeedback: false }, new Date(2026, 10, 21))).toContain('. 1 entry.')
  })
})

describe('file names', () => {
  it('dates the journal file', () => {
    expect(journalFileName(new Date(2026, 10, 21))).toBe('one-percent-journal-2026-11-21.md')
  })

  it('makes a safe file name from the date and title', () => {
    expect(entryFileName(entry())).toBe('2026-11-14-a-slow-start.md')
    expect(entryFileName(entry({ title: 'What drained you today? / Café notes!' }))).toBe('2026-11-14-what-drained-you-today-cafe-notes.md')
    expect(entryFileName(entry({ title: '???' }))).toBe('2026-11-14-entry.md')
  })
})
