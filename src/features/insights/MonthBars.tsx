import { useState } from 'react'
import { describeTrend, monthName } from './trend'

const HEIGHT = 32 // px of bar area; the tallest month fills it

/**
 * Six small bars, one per month, oldest first: how often a theme came up. The sentence underneath
 * says the same in words (and is what screen readers get); hovering or focusing a bar names it.
 */
export function MonthBars({ months, counts, name }: { months: string[]; counts: number[]; name: string }) {
  const [active, setActive] = useState<number | null>(null)
  const max = Math.max(...counts, 1)
  const caption =
    active === null
      ? describeTrend(months, counts)
      : `${monthName(months[active])}: ${counts[active]} ${counts[active] === 1 ? 'entry' : 'entries'}`

  return (
    <figure className="m-0 flex shrink-0 flex-col items-end gap-1.5">
      <div className="flex items-end gap-1" onMouseLeave={() => setActive(null)} aria-hidden>
        {counts.map((count, i) => (
          <div
            key={months[i]}
            onMouseEnter={() => setActive(i)}
            className="flex w-6 flex-col items-center gap-1 py-0.5" // hit area wider than the mark
          >
            <div className="flex w-full items-end justify-center" style={{ height: HEIGHT }}>
              <div
                className={`w-2.5 rounded-t-[4px] ${count === 0 ? 'bg-line' : 'bg-sky'} ${active !== null && active !== i ? 'opacity-50' : ''}`}
                style={{ height: count === 0 ? 2 : Math.max((count / max) * HEIGHT, 4) }}
              />
            </div>
            <span className={`text-[0.6875rem] leading-none ${active === i ? 'text-ink' : 'text-ink-faint'}`}>
              {monthName(months[i], 'short').charAt(0)}
            </span>
          </div>
        ))}
      </div>
      <figcaption className="text-right text-xs text-ink-muted">
        <span className="sr-only">{`${name} by month: ${describeTrend(months, counts)}`}</span>
        <span aria-hidden>{caption}</span>
      </figcaption>
    </figure>
  )
}
