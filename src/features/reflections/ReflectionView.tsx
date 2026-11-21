import { PenLine } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import type { WeeklyReflection } from '@/api/types'
import { Button } from '@/components/ui/button'
import { themeLabel } from '@/features/journal/themes'
import { entries, themeComparison } from './weeks'

/** Seven small squares, filled for each day the habit was done. */
function WeekDots({ done }: { done: number }) {
  return (
    <span aria-hidden className="flex gap-1">
      {Array.from({ length: 7 }, (_, i) => (
        <span
          key={i}
          className={`size-2.5 rounded-[3px] ${i < done ? 'bg-sunrise' : 'bg-sunken'}`}
        />
      ))}
    </span>
  )
}

/** A ready reflection: the AI's words, the user's own words, the numbers, and a question to take on. */
export function ReflectionView({ reflection }: { reflection: WeeklyReflection }) {
  const navigate = useNavigate()
  const {
    opening,
    quotes = [],
    themes = [],
    habits = [],
    question,
    entryCount,
    daysWritten = 0,
  } = reflection

  return (
    <article className="max-w-prose">
      <p className="mb-2 text-sm text-ink-muted">
        {entries(entryCount)} on {daysWritten} {daysWritten === 1 ? 'day' : 'days'}
      </p>
      <p className="font-serif text-xl leading-9">{opening}</p>

      {quotes.length > 0 && (
        <section aria-labelledby="your-words" className="mt-10">
          <h2 id="your-words" className="mb-4 font-serif text-2xl">
            In your words
          </h2>
          <ul className="flex flex-col gap-5">
            {quotes.map((quote) => (
              <li key={quote.entryId + quote.text}>
                <blockquote className="border-l-2 border-sky pl-4 font-serif text-lg leading-8">
                  “{quote.text}”
                </blockquote>
                <Link
                  to={`/journal/${quote.entryId}`}
                  className="mt-1 inline-block pl-4.5 text-sm text-action hover:underline"
                >
                  From {quote.entryTitle?.trim() || 'an untitled entry'}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {themes.length > 0 && (
        <section aria-labelledby="what-came-up" className="mt-10">
          <h2 id="what-came-up" className="mb-3 font-serif text-2xl">
            What came up
          </h2>
          <ul className="flex flex-col divide-y divide-line">
            {themes.map((theme) => (
              <li
                key={theme.name}
                className="flex flex-wrap items-baseline justify-between gap-x-4 py-2.5"
              >
                <span>{themeLabel(theme.name)}</span>
                <span className="text-sm text-ink-muted">
                  {entries(theme.thisWeek)} ·{' '}
                  {themeComparison(theme.thisWeek, theme.previousFourWeeks)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {habits.length > 0 && (
        <section aria-labelledby="habits-that-week" className="mt-10">
          <h2 id="habits-that-week" className="mb-3 font-serif text-2xl">
            Habits
          </h2>
          <ul className="flex flex-col divide-y divide-line">
            {habits.map((habit) => (
              <li key={habit.name} className="flex items-center justify-between gap-4 py-2.5">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden
                    className="size-3 shrink-0 rounded-full"
                    style={{ background: habit.colour }}
                  />
                  <span className="truncate">{habit.name}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <WeekDots done={habit.daysDone} />
                  <span className="w-20 text-right text-sm text-ink-muted">
                    {habit.daysDone} of 7 days
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {question && (
        <section
          aria-labelledby="carry-forward"
          className="mt-10 rounded-card border border-line bg-surface p-6"
        >
          <h2 id="carry-forward" className="mb-2 text-sm font-medium text-ink-muted">
            To carry into this week
          </h2>
          <p className="font-serif text-xl leading-8">{question}</p>
          <Button
            className="mt-5"
            onClick={() => navigate('/journal/new', { state: { prompt: question } })}
          >
            <PenLine aria-hidden />
            Write about this
          </Button>
        </section>
      )}

      <p className="mt-8 text-sm text-ink-muted">
        Written by AI from your entries; the quotes are your own words. The numbers are counted, not
        guessed.
      </p>
    </article>
  )
}
