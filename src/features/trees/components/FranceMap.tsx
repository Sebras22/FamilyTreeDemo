import { useMemo, useState } from 'react'
import { locatePlace } from '@/domain/places'
import { useI18n } from '@/shared/i18n/i18n'
import { FRANCE_DEPARTMENTS, FRANCE_VIEWBOX } from '@/domain/franceDepartments'
import type { FranceMapProps } from '@/interfaces/components/FranceMapProps'

export default function FranceMap({ places }: FranceMapProps) {
  const { t } = useI18n()
  const [hover, setHover] = useState<string | null>(null)

  const { counts, max, located, other } = useMemo(() => {
    const counts = new Map<string, number>()
    let other = 0
    for (const raw of places) {
      if (!raw?.trim() || raw.trim() === '?') continue
      const code = locatePlace(raw, FRANCE_DEPARTMENTS)
      if (code) counts.set(code, (counts.get(code) ?? 0) + 1)
      else other++
    }
    const located = [...counts.values()].reduce((s, n) => s + n, 0)
    return { counts, max: Math.max(1, ...counts.values()), located, other }
  }, [places])

  const active = hover ? FRANCE_DEPARTMENTS.find((d) => d.code === hover) : null

  return (
    <div className="france-map">
      <svg viewBox={FRANCE_VIEWBOX} role="img" aria-label={t('dash.places')}>
        {FRANCE_DEPARTMENTS.map((d) => {
          const n = counts.get(d.code) ?? 0
          return (
            <path
              key={d.code}
              d={d.d}
              className={`dep${n > 0 ? ' filled' : ''}${hover === d.code ? ' hot' : ''}`}
              style={n > 0 ? { fillOpacity: 0.28 + 0.72 * (n / max) } : undefined}
              onMouseEnter={() => setHover(d.code)}
              onMouseLeave={() => setHover(null)}
            >
              <title>{`${d.nom} (${d.code}) : ${n}`}</title>
            </path>
          )
        })}
      </svg>
      <p className="france-caption muted small" aria-live="polite">
        {active
          ? `${active.nom} (${active.code}) : ${counts.get(active.code) ?? 0}`
          : t('dash.mapSummary', { located, other })}
      </p>
    </div>
  )
}
