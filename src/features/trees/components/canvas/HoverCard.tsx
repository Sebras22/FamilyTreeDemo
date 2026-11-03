import { motion } from 'motion/react'
import type { CSSProperties } from 'react'
import { warningTone } from '@/domain/consistency'
import { formatDate, fullName, hasDate } from '@/domain/dates'
import { partnerOf } from '@/domain/graph'
import { kinship, kinshipLabel } from '@/domain/kinship'
import { useI18n } from '@/shared/i18n/i18n'
import type { HoverCardProps } from '@/interfaces/components/HoverCardProps'

export function HoverCard({ person, graph, focusId, warnings, anchor }: HoverCardProps) {
  const { t, lang } = useI18n()
  const width = 270
  const below = anchor.top < 300
  const centerX = anchor.left + anchor.width / 2
  const left = Math.min(Math.max(8, centerX - width / 2), window.innerWidth - width - 8)
  const position: CSSProperties & Record<string, string | number> = {
    left,
    '--arrow-x': `${centerX - left}px`,
    ...(below ? { top: anchor.bottom + 14 } : { bottom: window.innerHeight - anchor.top + 14 }),
  }
  const name = (id: number) => {
    const p = graph.persons.get(id)
    return p ? fullName(p) : '?'
  }
  const parents = (graph.parentsOf.get(person.id) ?? []).map((l) => name(l.parentId))
  const spouses = (graph.couplesOf.get(person.id) ?? []).map((c) => name(partnerOf(c, person.id)))
  const children = (graph.childrenOf.get(person.id) ?? []).length
  const relation = focusId != null && focusId !== person.id ? kinship(graph, focusId, person.id) : null
  const focusPerson = focusId != null ? graph.persons.get(focusId) : undefined
  const birth = [formatDate(person.birth, lang), person.birthPlace].filter(Boolean).join(' — ')
  const death = [formatDate(person.death, lang), person.deathPlace].filter(Boolean).join(' — ')
  const now = new Date().getFullYear()
  const endYear = person.death?.year ?? (person.living ? now : null)
  const age = person.birth?.year != null && endYear != null ? endYear - person.birth.year : null

  const openWarnings = warnings.filter((w) => !w.confirmed)

  const rows: [string, string][] = []
  if (birth) rows.push([t('form.birth'), birth])
  if (death) rows.push([t('form.death'), death])
  else if (!person.living && !hasDate(person.death)) rows.push([t('form.death'), t('panel.deceasedUnknown')])
  if (age != null) rows.push([t('hover.age'), t('card.age', { n: age })])
  if (person.occupation) rows.push([t('form.occupation'), person.occupation])
  if (parents.length) rows.push([t('panel.parents'), parents.join(', ')])
  if (spouses.length) rows.push([t('panel.unions'), spouses.join(', ')])
  if (children) rows.push([t('panel.children'), t('hover.children', { n: children })])

  return (
    <motion.div
      className={`hover-card sex-${person.sex.toLowerCase()}${below ? ' below' : ''}`}
      role="tooltip"
      style={{ ...position, transformOrigin: below ? 'top center' : 'bottom center' }}
      initial={{ opacity: 0, y: below ? -8 : 8, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: below ? -4 : 4, scale: 0.97, transition: { duration: 0.1 } }}
      transition={{ type: 'spring', stiffness: 460, damping: 30 }}
    >
      <strong className="hover-name">{fullName(person)}</strong>
      {relation && focusPerson && <span className="hover-relation">{kinshipLabel(relation, person.sex, lang)} · {fullName(focusPerson)}</span>}
      {rows.length > 0 ? (
        <dl>
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <span className="muted small">{t('hover.empty')}</span>
      )}
      {openWarnings.length > 0 && (
        <ul className={`hover-warnings ${warningTone(openWarnings)}`}>
          {openWarnings.slice(0, 3).map((w, i) => (
            <li key={i}>{t(`warn.${w.code}`, { ...w.params, other: w.otherId != null ? name(w.otherId) : '' })}</li>
          ))}
        </ul>
      )}
      <span className="hover-hint">{t('hover.hint')}</span>
    </motion.div>
  )
}
