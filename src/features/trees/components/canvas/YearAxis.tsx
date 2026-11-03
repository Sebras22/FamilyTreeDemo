import { useViewport } from '@xyflow/react'
import type { YearAxisProps } from '@/interfaces/components/YearAxisProps'

export function YearAxis({ scale }: YearAxisProps) {
  const { y, zoom } = useViewport()
  const lines: { year: number; top: number; major: boolean }[] = []
  const first = Math.ceil(scale.minYear / 25) * 25
  for (let year = first; year <= scale.maxYear + 25; year += 25) {
    lines.push({ year, top: scale.yearToY(year) * zoom + y, major: year % 50 === 0 })
  }
  return (
    <>
      <div className="year-axis under" aria-hidden="true">
        {lines.map((l) => (
          <div key={l.year} className={`year-line${l.major ? ' major' : ''}`} style={{ top: l.top }} />
        ))}
      </div>
      <div className="year-axis over" aria-hidden="true">
        {lines.map((l) =>
          l.major ? (
            <div key={l.year} className="year-label" style={{ top: l.top }}>
              {l.year}
            </div>
          ) : null,
        )}
      </div>
    </>
  )
}
