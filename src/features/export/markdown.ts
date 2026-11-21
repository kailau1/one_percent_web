import type { JournalEntry } from '@/api/types'
import { formatLongDate, formatTime, parseDateTime } from '@/lib/dates'

export interface ExportOptions {
  /** Add each entry's AI feedback after it, as a quote. */
  includeFeedback: boolean
}

/** "Saturday 14 November 2026, 9:30 am", in the device's time zone. */
export function writtenOn(entry: JournalEntry): string | null {
  const date = parseDateTime(entry.createdAt)
  return date ? `${formatLongDate(date)}, ${formatTime(date)}` : null
}

export function entryTitle(entry: JournalEntry): string {
  return entry.title?.trim() || 'Untitled'
}

/** Puts "> " before every line, so the feedback reads as a quote in any Markdown viewer. */
function quote(text: string): string {
  return text
    .trim()
    .split('\n')
    .map((line) => (line.trim() ? `> ${line}` : '>'))
    .join('\n')
}

/** One entry as Markdown: title, date, the writing, then (optionally) the feedback. */
export function entryToMarkdown(entry: JournalEntry, { includeFeedback }: ExportOptions): string {
  const parts = [`## ${entryTitle(entry)}`]
  const date = writtenOn(entry)
  if (date) parts.push(`*${date}*`)
  parts.push((entry.content ?? '').trim())
  if (includeFeedback && entry.llmResponse?.trim()) {
    parts.push('**Feedback**', quote(entry.llmResponse))
  }
  return parts.join('\n\n')
}

/** A whole journal as one Markdown document, with a short heading saying what it is. */
export function journalToMarkdown(entries: JournalEntry[], options: ExportOptions, exportedAt: Date = new Date()): string {
  const count = `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`
  const header = `# One Percent journal\n\nExported ${formatLongDate(exportedAt)}. ${count}.`
  return [header, ...entries.map((entry) => entryToMarkdown(entry, options))].join('\n\n---\n\n') + '\n'
}

/** "one-percent-journal-2026-11-21.md" */
export function journalFileName(date: Date = new Date()): string {
  return `one-percent-journal-${isoDay(date)}.md`
}

/** "2026-11-14-a-slow-start.md": the day it was written, then the title, safe for any file system. */
export function entryFileName(entry: JournalEntry): string {
  const slug = entryTitle(entry)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .slice(0, 60)
    .replace(/-+$/, '')
  const date = parseDateTime(entry.createdAt)
  return `${date ? `${isoDay(date)}-` : ''}${slug || 'entry'}.md`
}

function isoDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
