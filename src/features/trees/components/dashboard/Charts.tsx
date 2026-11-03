import type { DonutProps } from '@/interfaces/components/DonutProps'
import type { ProgressProps } from '@/interfaces/components/ProgressProps'
import type { RankingProps } from '@/interfaces/components/RankingProps'

export function Donut({ parts }: DonutProps) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offsets = parts.map((_, i) => parts.slice(0, i).reduce((s, q) => s + (q.value / total) * circumference, 0))
  return (
    <div className="donut">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={radius} className="donut-track" />
        {parts.map((p, i) => {
          const length = (p.value / total) * circumference
          return (
            <circle
              key={p.label}
              cx="60"
              cy="60"
              r={radius}
              className={`donut-part ${p.className}`}
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offsets[i]}
              transform="rotate(-90 60 60)"
            />
          )
        })}
        <text x="60" y="66" textAnchor="middle" className="donut-total">
          {total === 1 && parts.every((p) => p.value === 0) ? 0 : total}
        </text>
      </svg>
      <ul>
        {parts.map((p) => (
          <li key={p.label}>
            <span className={`dot ${p.className}`} /> {p.label} <strong>{p.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Progress({ value, total, tone }: ProgressProps) {
  const pct = total === 0 ? 100 : Math.round((value / total) * 100)
  return (
    <div className="progress-bar" aria-label={`${pct}%`}>
      <div className={`fill ${tone ?? ''}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Ranking({ items }: RankingProps) {
  const max = items[0]?.count ?? 1
  return (
    <ul className="ranking">
      {items.map((s) => (
        <li key={s.label}>
          <span>{s.label}</span>
          <div className="rank-bar">
            <div style={{ width: `${(s.count / max) * 100}%` }} />
          </div>
          <strong>{s.count}</strong>
        </li>
      ))}
    </ul>
  )
}
