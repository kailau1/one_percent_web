import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ArrowLeft, Printer } from 'lucide-react'
import Markdown from 'react-markdown'
import { useNavigate, useSearchParams } from 'react-router'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { Wordmark } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatLongDate } from '@/lib/dates'
import { fetchEntriesForExport } from './api'
import { entryTitle, writtenOn } from './markdown'

/**
 * /print: a clean, paper-shaped copy of the journal (or one entry, with ?entry=<id>) for the
 * browser's "Save as PDF". Uses the browser's own print engine, so the PDF has real, selectable
 * text and no extra library. The toolbar is hidden when printing.
 */
export function PrintPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const entryId = searchParams.get('entry')
  const includeFeedback = searchParams.get('feedback') !== '0'
  const [exportedAt] = useState(() => new Date())

  const { data: entries, error, isPending, refetch, isFetching } = useQuery({
    queryKey: ['journals', 'export', entryId ?? 'all'],
    queryFn: () => fetchEntriesForExport(entryId),
    staleTime: 0,
  })

  return (
    <div className="print-page min-h-dvh bg-surface">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-5 py-3 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft aria-hidden />
          Back
        </Button>
        <p className="hidden text-sm text-ink-muted sm:block">In the print dialog, choose “Save as PDF” as the destination.</p>
        <Button onClick={() => window.print()} disabled={!entries || entries.length === 0}>
          <Printer aria-hidden />
          Print or save as PDF
        </Button>
      </div>

      <main className="mx-auto max-w-prose px-6 py-12 print:max-w-none print:p-0">
        {isPending && (
          <div role="status" aria-label="Preparing your journal" className="flex flex-col gap-3">
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </div>
        )}
        {error && <ErrorState error={error} onRetry={() => refetch()} retrying={isFetching} />}
        {entries && entries.length === 0 && <EmptyState title="Nothing to print yet">Entries you write will appear here.</EmptyState>}

        {entries && entries.length > 0 && (
          <>
            {!entryId && (
              <header className="mb-14 border-b border-line pb-8">
                <Wordmark />
                <p className="mt-6 text-ink-muted">
                  Journal exported {formatLongDate(exportedAt)}. {entries.length} {entries.length === 1 ? 'entry' : 'entries'}.
                </p>
              </header>
            )}
            {entries.map((entry) => (
              <article key={entry.id} className="print-entry mb-14 last:mb-0">
                <h1 className="font-serif text-3xl font-medium leading-tight tracking-tight">{entryTitle(entry)}</h1>
                {writtenOn(entry) && <p className="mt-2 text-sm text-ink-muted">{writtenOn(entry)}</p>}
                <div className="mt-6 whitespace-pre-wrap font-serif text-lg leading-8">{entry.content}</div>
                {includeFeedback && entry.llmResponse?.trim() && (
                  <aside className="feedback-prose mt-6 border-l-2 border-sky pl-5 text-[0.9375rem] leading-7">
                    <p className="mb-2 font-medium text-ink-muted">Feedback</p>
                    <Markdown>{entry.llmResponse}</Markdown>
                  </aside>
                )}
              </article>
            ))}
          </>
        )}
      </main>
    </div>
  )
}
