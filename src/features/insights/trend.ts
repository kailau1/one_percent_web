/** "2026-10" → "October" (or "Oct" when short). Built from the parts, so the time zone can't shift it. */
export function monthName(month: string, style: 'long' | 'short' = 'long'): string {
  const [year, m] = month.split('-').map(Number)
  return new Date(year, m - 1, 1).toLocaleString('en-GB', { month: style })
}

const entries = (n: number) => `${n} ${n === 1 ? 'entry' : 'entries'}`

/** A sentence for screen readers and the caption under the bars, e.g. "Most in October: 4 entries." */
export function describeTrend(months: string[], counts: number[]): string {
  const total = counts.reduce((a, b) => a + b, 0)
  if (total === 0) return `None in the last ${months.length} months.`
  const peak = Math.max(...counts)
  const peakMonths = months.filter((_, i) => counts[i] === peak)
  if (peakMonths.length > 1) return `${entries(total)} in the last ${months.length} months, spread out.`
  return `Most in ${monthName(peakMonths[0])}: ${entries(peak)}.`
}

/**
 * A word only when the pattern is clear (small numbers make most "trends" noise):
 * - "More this month": this month has at least 2 entries and more than any earlier month;
 * - "Quieter lately": one of the user's main themes that hasn't come up for two months.
 */
export function trendLabel(counts: number[], isMainTheme: boolean): 'More this month' | 'Quieter lately' | null {
  if (counts.length < 3) return null
  const current = counts[counts.length - 1]
  const earlier = counts.slice(0, -1)
  if (current >= 2 && earlier.every((n) => current > n)) return 'More this month'
  const lastTwo = counts.slice(-2)
  if (isMainTheme && lastTwo.every((n) => n === 0) && counts.slice(0, -2).some((n) => n > 0)) return 'Quieter lately'
  return null
}
