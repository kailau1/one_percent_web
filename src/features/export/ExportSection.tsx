import { useMutation } from '@tanstack/react-query'
import { Download, Printer } from 'lucide-react'
import { useId, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/button'
import { downloadText } from '@/lib/download'
import { fetchAllEntries } from './api'
import { journalFileName, journalToMarkdown } from './markdown'

/** "Your journal": download every entry as one Markdown file, or open a printable copy for PDF. */
export function ExportSection() {
  const [includeFeedback, setIncludeFeedback] = useState(true)
  const checkboxId = useId()

  const download = useMutation({
    mutationFn: fetchAllEntries,
    onSuccess: (entries) => {
      if (entries.length === 0) {
        toast('There are no entries to export yet.')
        return
      }
      downloadText(journalFileName(), journalToMarkdown(entries, { includeFeedback }))
      toast.success(`Downloaded ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  return (
    <section aria-labelledby="export-heading" className="max-w-md">
      <h2 id="export-heading" className="mb-2 font-serif text-2xl">
        Your journal
      </h2>
      <p className="mb-4 text-ink-muted">Keep a copy of everything you’ve written, as a Markdown file or a PDF.</p>

      <label htmlFor={checkboxId} className="mb-5 flex items-center gap-2.5">
        <input
          id={checkboxId}
          type="checkbox"
          checked={includeFeedback}
          onChange={(event) => setIncludeFeedback(event.target.checked)}
          className="size-4 accent-[var(--action)]"
        />
        Include AI feedback
      </label>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => download.mutate()} disabled={download.isPending}>
          <Download aria-hidden />
          {download.isPending ? 'Preparing…' : 'Download as Markdown'}
        </Button>
        <Button asChild variant="secondary">
          <Link to={`/print?feedback=${includeFeedback ? 1 : 0}`}>
            <Printer aria-hidden />
            Save as PDF
          </Link>
        </Button>
      </div>
    </section>
  )
}
