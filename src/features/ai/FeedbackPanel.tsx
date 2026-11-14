import { Sparkles } from 'lucide-react'
import Markdown from 'react-markdown'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface FeedbackPanelProps {
  /** The feedback (markdown), if the entry has any. */
  feedback?: string | null
  isPending: boolean
  error: unknown
  onRequest: () => void
  /** Nothing has been written yet, so there is nothing to give feedback on. */
  nothingToReview: boolean
  /** The entry has unsaved changes (or isn't saved at all), so asking will save it first. */
  needsSave: boolean
}

/**
 * AI feedback on the open entry. Lives beside the writing so it can be read against the text.
 * A failed request shows an error here and is never stored as if it were feedback.
 */
export function FeedbackPanel({ feedback, isPending, error, onRequest, nothingToReview, needsSave }: FeedbackPanelProps) {
  const hasFeedback = Boolean(feedback?.trim())
  const askLabel = needsSave ? 'Save and get feedback' : hasFeedback ? 'Get fresh feedback' : 'Get feedback'

  return (
    <aside aria-label="Feedback" className="rounded-card border border-line bg-surface p-5">
      <h2 className="mb-3 flex items-center gap-2 font-serif text-xl">
        <Sparkles aria-hidden className="size-4 text-sunrise" />
        Feedback
      </h2>

      {isPending ? (
        <div role="status" className="flex flex-col gap-2.5">
          <p className="text-sm text-ink-muted">Reading your entry. This can take a little while.</p>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ) : (
        <>
          {Boolean(error) && <ErrorState compact error={error} onRetry={onRequest} className="mb-4 flex-wrap" />}

          {hasFeedback ? (
            <div className="feedback-prose text-[0.9375rem] leading-7">
              <Markdown>{feedback}</Markdown>
            </div>
          ) : (
            !error && (
              <p className="text-[0.9375rem] leading-7 text-ink-muted">
                Get a short, personal reflection on this entry. It takes your habits and what you’ve written before into account.
              </p>
            )
          )}

          {!error && (
            <Button
              variant={hasFeedback ? 'secondary' : 'primary'}
              size="sm"
              className="mt-4"
              onClick={onRequest}
              disabled={nothingToReview}
            >
              {askLabel}
            </Button>
          )}
          {nothingToReview && <p className="mt-2 text-sm text-ink-muted">Write something first.</p>}
        </>
      )}
    </aside>
  )
}
