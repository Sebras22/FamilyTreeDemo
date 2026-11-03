import { useMemo } from 'react'
import { lifeSpan } from '@/domain/dates'
import { useI18n } from '@/shared/i18n/i18n'
import type { FanChartProps } from '@/interfaces/components/FanChartProps'
import type { Graph } from '@/interfaces/domain/Graph'
import type { Person } from '@/interfaces/api/Person'
import type { Slot } from '@/interfaces/components/Slot'

const CENTER_R = 62
const RING = 74

function orderedParents(graph: Graph, id: number): (Person | null)[] {
  const parents = (graph.parentsOf.get(id) ?? [])
    .map((l) => graph.persons.get(l.parentId))
    .filter((p): p is Person => !!p)
    .sort((a, b) => (a.sex === 'MALE' ? 0 : a.sex === 'UNKNOWN' ? 1 : 2) - (b.sex === 'MALE' ? 0 : b.sex === 'UNKNOWN' ? 1 : 2))
  if (parents.length === 0) return [null, null]
  if (parents.length === 1) return parents[0].sex === 'FEMALE' ? [null, parents[0]] : [parents[0], null]
  return [parents[0], parents[1]]
}

function buildSlots(graph: Graph, focusId: number, generations: number): Slot[] {
  const root = graph.persons.get(focusId) ?? null
  const slots: Slot[] = [{ person: root, gen: 0, index: 0 }]
  let previous: Slot[] = slots
  for (let gen = 1; gen <= generations; gen++) {
    const current: Slot[] = []
    for (const parent of previous) {
      const [left, right] = parent.person ? orderedParents(graph, parent.person.id) : [null, null]
      current.push({ person: left, gen, index: parent.index * 2 }, { person: right, gen, index: parent.index * 2 + 1 })
    }
    slots.push(...current)
    previous = current
  }
  return slots
}

const point = (cx: number, cy: number, angle: number, r: number) => `${(cx + r * Math.cos(angle)).toFixed(2)} ${(cy - r * Math.sin(angle)).toFixed(2)}`

export default function FanChart({ graph, focusId, generations, selectedId, onSelect, onFocus }: FanChartProps) {
  const { lang, t } = useI18n()
  const slots = useMemo(() => buildSlots(graph, focusId, generations), [graph, focusId, generations])
  const outer = CENTER_R + generations * RING
  const width = outer * 2 + 24
  const height = outer + 40
  const cx = width / 2
  const cy = outer + 14
  const root = slots[0].person

  return (
    <div className="fan-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="fan" role="img" aria-label={t('fan.title')}>
        {slots.slice(1).map((slot) => {
          const count = 2 ** slot.gen
          const step = Math.PI / count
          const a1 = Math.PI - slot.index * step
          const a2 = a1 - step
          const rin = CENTER_R + (slot.gen - 1) * RING + 2
          const rout = CENTER_R + slot.gen * RING - 2
          const path = `M ${point(cx, cy, a1, rin)} L ${point(cx, cy, a1, rout)} A ${rout} ${rout} 0 0 1 ${point(cx, cy, a2, rout)} L ${point(cx, cy, a2, rin)} A ${rin} ${rin} 0 0 0 ${point(cx, cy, a1, rin)} Z`
          const mid = (a1 + a2) / 2
          const rm = (rin + rout) / 2
          const [tx, ty] = point(cx, cy, mid, rm).split(' ').map(Number)
          const deg = (mid * 180) / Math.PI
          const tangential = slot.gen <= 2
          let rotation = tangential ? 90 - deg : -deg
          if (!tangential && deg > 90) rotation += 180
          const p = slot.person
          const sizeClass = slot.gen <= 2 ? 'big' : slot.gen === 3 ? 'mid' : 'small'
          const selected = p != null && p.id === selectedId
          return (
            <g
              key={`${slot.gen}-${slot.index}`}
              className={`fan-slot ${p ? p.sex.toLowerCase() : 'empty'}${selected ? ' selected' : ''}`}
              onClick={() => p && onSelect(p.id)}
              onDoubleClick={() => p && onFocus(p.id)}
              role={p ? 'button' : undefined}
              tabIndex={p ? 0 : undefined}
              onKeyDown={(e) => p && e.key === 'Enter' && onSelect(p.id)}
            >
              <path d={path} />
              {p && (
                <text transform={`translate(${tx} ${ty}) rotate(${rotation})`} textAnchor="middle" className={sizeClass}>
                  <title>{`${p.firstName} ${p.lastName} ${lifeSpan(p, lang)}`}</title>
                  {slot.gen <= 3 ? (
                    <>
                      <tspan x="0" dy="-0.2em" fontWeight="700">
                        {p.firstName}
                      </tspan>
                      <tspan x="0" dy="1.15em">
                        {p.lastName}
                      </tspan>
                      {slot.gen <= 2 && (
                        <tspan x="0" dy="1.2em" className="years">
                          {lifeSpan(p, lang)}
                        </tspan>
                      )}
                    </>
                  ) : (
                    <tspan x="0" dy="0.3em">{`${p.firstName} ${p.lastName[0] ?? ''}.`}</tspan>
                  )}
                </text>
              )}
            </g>
          )
        })}

        <g className={`fan-center ${root ? root.sex.toLowerCase() : ''}`} onClick={() => root && onSelect(root.id)}>
          <circle cx={cx} cy={cy} r={CENTER_R - 2} />
          {root && (
            <text x={cx} y={cy - 18} textAnchor="middle">
              <tspan x={cx} fontWeight="800">{root.firstName}</tspan>
              <tspan x={cx} dy="1.2em">{root.lastName}</tspan>
              <tspan x={cx} dy="1.3em" className="years">{lifeSpan(root, lang)}</tspan>
            </text>
          )}
        </g>
      </svg>
    </div>
  )
}
