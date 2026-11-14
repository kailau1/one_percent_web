/**
 * The idea behind the name, drawn to scale: 1% better each day for a year is 1.01^365 ≈ 37.8×.
 * The curve looks flat for months and then takes off, which is the point.
 */
const DAYS = 365
const WIDTH = 480
const HEIGHT = 300
const FINAL = Math.pow(1.01, DAYS)

function pointAt(day: number): [number, number] {
  const x = (day / DAYS) * WIDTH
  const y = HEIGHT - ((Math.pow(1.01, day) - 1) / (FINAL - 1)) * HEIGHT
  return [x, y]
}

const path = Array.from({ length: DAYS + 1 }, (_, day) => {
  const [x, y] = pointAt(day)
  return `${day === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
}).join(' ')

const [endX, endY] = pointAt(DAYS)

export function CompoundingCurve({ className }: { className?: string }) {
  return (
    <figure className={className}>
      <svg viewBox={`-8 -24 ${WIDTH + 56} ${HEIGHT + 56}`} className="w-full overflow-visible" role="img" aria-labelledby="curve-title">
        <title id="curve-title">A curve of one percent daily improvement over a year, ending 37.8 times higher</title>
        {/* a year of days along the bottom, one tick per week */}
        {Array.from({ length: 53 }, (_, week) => (
          <line key={week} x1={(week / 52) * WIDTH} x2={(week / 52) * WIDTH} y1={HEIGHT + 8} y2={HEIGHT + (week % 4 === 0 ? 18 : 13)} stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
        ))}
        <line x1="0" x2={WIDTH} y1={HEIGHT} y2={HEIGHT} stroke="currentColor" strokeOpacity="0.25" strokeDasharray="2 6" />
        <path d={path} fill="none" stroke="var(--sky)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" className="curve-draw" />
        <circle cx={endX} cy={endY} r="7" fill="var(--sunrise)" className="curve-dot" />
        <text x={endX - 14} y={endY - 2} textAnchor="end" className="curve-dot fill-current font-serif text-[1.375rem]">37.8×</text>
        <text x="0" y={HEIGHT + 34} className="fill-current text-[0.6875rem] opacity-60">Day 1</text>
        <text x={WIDTH} y={HEIGHT + 34} textAnchor="end" className="fill-current text-[0.6875rem] opacity-60">Day 365</text>
      </svg>
    </figure>
  )
}
