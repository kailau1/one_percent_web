import { X } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { getErrorMessage } from '@/api/client'
import type { AiContext, AiContextSettings } from '@/api/types'
import { ErrorState } from '@/components/ErrorState'
import { Page } from '@/components/layout/Page'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { themeLabel } from '@/features/journal/themes'
import { useAddFact, useAiContext, useDeleteFact, useUpdateAiSettings } from './hooks'

/** One kind of context: what it is, whether it's sent, and what's in it. */
function Source({
  title,
  description,
  setting,
  context,
  children,
}: {
  title: string
  description: ReactNode
  setting: keyof AiContextSettings
  context: AiContext
  children?: ReactNode
}) {
  const update = useUpdateAiSettings()
  const on = context.settings[setting]
  const headingId = `source-${setting}`

  return (
    <section aria-labelledby={headingId} className="border-b border-line py-6 last:border-b-0">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 id={headingId} className="font-serif text-xl">
            {title}
          </h2>
          <p className="mt-1 text-ink-muted">{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 pt-1">
          <span className="text-sm text-ink-muted" aria-hidden>
            {on ? 'Used' : 'Not used'}
          </span>
          <Switch
            checked={on}
            label={`Use ${title.toLowerCase()}`}
            onCheckedChange={(checked) =>
              update.mutate({ ...context.settings, [setting]: checked })
            }
          />
        </div>
      </div>
      {children && <div className={on ? 'mt-4' : 'mt-4 opacity-60'}>{children}</div>}
    </section>
  )
}

function Facts({ context }: { context: AiContext }) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string>()
  const add = useAddFact()
  const remove = useDeleteFact()
  const full = context.facts.length >= context.maxFacts

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!text.trim()) {
      setError('Write something to add.')
      return
    }
    setError(undefined)
    add.mutate(text, {
      onSuccess: () => setText(''),
      onError: (e) => setError(getErrorMessage(e)), // the text stays, so nothing is lost
    })
  }

  return (
    <>
      {context.facts.length > 0 ? (
        <ul aria-label="Things you’ve told One Percent" className="mb-5 flex flex-col gap-2">
          {context.facts.map((fact) => (
            <li
              key={fact.id}
              className="flex items-start justify-between gap-3 rounded-card border border-line bg-surface px-4 py-2.5"
            >
              <span className="min-w-0 break-words">{fact.text}</span>
              <button
                type="button"
                onClick={() => remove.mutate(fact.id)}
                aria-label={`Delete “${fact.text}”`}
                className="grid size-7 shrink-0 place-items-center rounded-full text-ink-faint hover:bg-sunken hover:text-ink"
              >
                <X aria-hidden className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-5 text-ink-muted">
          Nothing yet. Add anything you’d want a thoughtful friend to keep in mind.
        </p>
      )}
      {full ? (
        <p className="text-sm text-ink-muted">
          That’s the most it keeps ({context.maxFacts}). Delete one to add another.
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <Field
              label="Add something about you"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={context.maxFactLength}
              placeholder="e.g. Training for a half marathon in March"
              error={error}
              hint={`${context.facts.length} of ${context.maxFacts}. Short and factual works best.`}
            />
          </div>
          <Button type="submit" disabled={add.isPending} className="sm:mt-7">
            Add
          </Button>
        </form>
      )}
    </>
  )
}

function Preview({ text }: { text: string }) {
  return (
    <details className="mt-8 rounded-card border border-line bg-surface">
      <summary className="cursor-pointer px-4 py-3 font-medium">Exactly what’s sent</summary>
      <div className="border-t border-line px-4 py-3">
        <p className="mb-3 text-sm text-ink-muted">
          This goes with each request for feedback or writing prompts. Feedback on an entry also
          includes past advice, if that’s on.
        </p>
        <pre
          aria-label="Context sent to the AI"
          className="whitespace-pre-wrap break-words text-sm leading-6"
        >
          {text}
        </pre>
      </div>
    </details>
  )
}

function AboutYouSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading what One Percent knows"
      className="flex max-w-2xl flex-col gap-8"
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  )
}

/** /about-you: the AI's memory of the user, visible and in their hands. */
export function AboutYouPage() {
  const { data, error, isPending, refetch, isFetching } = useAiContext()

  return (
    <Page title="What One Percent knows">
      <p className="mb-4 max-w-2xl text-ink-muted">
        When you ask for feedback or writing prompts, the AI is given a little context about you.
        This is all of it. Switch off anything you’d rather it didn’t use.
      </p>
      {isPending && <AboutYouSkeleton />}
      {error && (
        <ErrorState
          compact={Boolean(data)}
          error={error}
          onRetry={() => refetch()}
          retrying={isFetching}
          className="mb-6 max-w-2xl"
        />
      )}
      {data && (
        <div className="max-w-2xl">
          <Source
            title="Things you’ve told it"
            setting="useFacts"
            context={data}
            description="In your own words, kept until you delete them."
          >
            <Facts context={data} />
          </Source>
          <Source
            title="Your habits"
            setting="useHabits"
            context={data}
            description={
              <>
                Habits you’ve ticked or changed in the last week.{' '}
                <Link to="/habits" className="text-action hover:underline">
                  Manage habits
                </Link>
              </>
            }
          >
            {data.habits.length > 0 ? (
              <ul aria-label="Habits it knows about" className="flex flex-wrap gap-2">
                {data.habits.map((habit) => (
                  <li
                    key={habit}
                    className="rounded-full border border-line bg-surface px-3 py-0.5 text-sm text-ink-muted"
                  >
                    {habit}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">None this week.</p>
            )}
          </Source>
          <Source
            title="What you often write about"
            setting="useThemes"
            context={data}
            description={
              <>
                Your most common themes. You can correct an entry’s themes when you open it.{' '}
                <Link to="/insights" className="text-action hover:underline">
                  See insights
                </Link>
              </>
            }
          >
            {data.themes.length > 0 ? (
              <ul aria-label="Themes it knows about" className="flex flex-wrap gap-2">
                {data.themes.map((theme) => (
                  <li
                    key={theme}
                    className="rounded-full border border-line bg-surface px-3 py-0.5 text-sm text-ink-muted"
                  >
                    {themeLabel(theme)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">No themes yet.</p>
            )}
          </Source>
          <Source
            title="Past advice"
            setting="usePastAdvice"
            context={data}
            description="With feedback on an entry, short summaries of what it suggested on your most similar earlier entries, so it doesn’t repeat itself."
          />
          <Preview text={data.preview} />
        </div>
      )}
    </Page>
  )
}
