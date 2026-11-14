import { Lightbulb, RotateCw } from 'lucide-react'
import { useState } from 'react'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePrompts } from './hooks'

/**
 * "Not sure what to write?" Suggestions are only fetched when asked for, so starting a blank
 * entry is instant and doesn't spend an AI call nobody wanted.
 */
export function PromptPicker({ onPick }: { onPick: (prompt: string) => void }) {
  const [open, setOpen] = useState(false)
  const { data: prompts, error, isFetching, refetch } = usePrompts(open)

  if (!open) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)} className="mb-8 self-start">
        <Lightbulb aria-hidden />
        Suggest something to write about
      </Button>
    )
  }

  return (
    <section aria-label="Writing prompts" className="mb-8 rounded-card border border-line bg-surface p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl">Pick a prompt</h2>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Hide
        </Button>
      </div>

      {isFetching && (
        <div role="status" aria-label="Loading prompts" className="flex flex-col gap-2.5">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      )}

      {!isFetching && Boolean(error) && <ErrorState compact error={error} onRetry={() => refetch()} className="flex-wrap" />}

      {!isFetching && !error && prompts && (
        <>
          {prompts.length === 0 && <p className="text-ink-muted">No suggestions came back this time.</p>}
          <ul className="flex flex-col gap-2">
            {prompts.map((prompt) => (
              <li key={prompt}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(prompt)
                    setOpen(false)
                  }}
                  className="w-full rounded-control border border-line px-4 py-2.5 text-left font-serif text-[1.0625rem] transition-colors hover:bg-sky-wash"
                >
                  {prompt}
                </button>
              </li>
            ))}
          </ul>
          <Button variant="link" size="sm" className="mt-3 h-auto p-0" onClick={() => refetch()}>
            <RotateCw aria-hidden />
            Suggest different ones
          </Button>
        </>
      )}
    </section>
  )
}
