import { Button, Popover } from '@mantine/core'
import { Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { memo, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Handle, Position, useStore, type NodeProps } from '@xyflow/react'
import { fullName, lifeSpan } from '@/domain/dates'
import { usePhoto } from '@/features/persons/hooks/photos'
import { useI18n } from '@/shared/i18n/i18n'
import { TombstoneIcon } from '@/shared/ui/Icons'
import { HoverCard } from './HoverCard'
import type { CardNode } from '@/interfaces/components/CardNode'
import type { Warning } from '@/interfaces/domain/Warning'

export const PersonCard = memo(function PersonCard({ data, dragging }: NodeProps<CardNode>) {
  const { person, selected, estimated, warningCount, warningTone: tone, onConfirmWarning, childCount, collapsed, onToggleCollapse, animate, canEdit, onAdd, onContext, graph, focusId, warnings } = data
  const [hovered, setHovered] = useState(false)
  const [anchor, setAnchor] = useState<DOMRect | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const hoverTimer = useRef<number | null>(null)
  useEffect(() => {
    if (!hovered) return
    const close = () => setHovered(false)
    window.addEventListener('wheel', close, { capture: true, passive: true })
    window.addEventListener('pointerdown', close, { capture: true })
    return () => {
      window.removeEventListener('wheel', close, { capture: true })
      window.removeEventListener('pointerdown', close, { capture: true })
    }
  }, [hovered])
  const level = useStore((st) => (st.transform[2] < 0.45 ? 0 : st.transform[2] > 1.15 ? 2 : 1))
  const press = useRef<{ timer: number; x: number; y: number } | null>(null)
  const age = person.birth?.year != null ? (person.death?.year ?? (person.living ? new Date().getFullYear() : null)) : null
  const { lang, t } = useI18n()
  const photo = usePhoto(person.id, person.hasPhoto)
  const doubts = warnings.filter((w) => w.severity === 'doubt' && !w.confirmed)
  const otherName = (w: Warning) => {
    const other = w.otherId != null ? graph.persons.get(w.otherId) : undefined
    return other ? fullName(other) : ''
  }
  const classes = ['person-card', `sex-${person.sex.toLowerCase()}`, `level-${level}`]
  if (selected) classes.push('selected')
  if (person.floating) classes.push('floating')
  if (tone === 'error') classes.push('has-warning')
  else if (tone === 'doubt') classes.push('has-doubt')
  if (person.birthKind !== 'LIVE') classes.push('stillborn')

  return (
    <motion.div
      ref={cardRef}
      className={classes.join(' ')}
      initial={animate ? { opacity: 0, scale: 0.9 } : false}
      animate={{ opacity: person.floating ? 0.55 : 1, scale: 1 }}
      whileHover={dragging ? undefined : { scale: 1.035 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onPointerEnter={(e) => {
        if (e.pointerType !== 'mouse') return
        hoverTimer.current = window.setTimeout(() => {
          const rect = cardRef.current?.getBoundingClientRect()
          if (rect) {
            setAnchor(rect)
            setHovered(true)
          }
        }, 280)
      }}
      onPointerLeave={() => {
        if (hoverTimer.current) window.clearTimeout(hoverTimer.current)
        setHovered(false)
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== 'touch') return
        const { clientX: x, clientY: y } = e
        press.current = { x, y, timer: window.setTimeout(() => onContext(person.id, x, y), 550) }
      }}
      onPointerMove={(e) => {
        const p = press.current
        if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 8) {
          window.clearTimeout(p.timer)
          press.current = null
        }
      }}
      onPointerUp={() => {
        if (press.current) window.clearTimeout(press.current.timer)
        press.current = null
      }}
    >
      <Handle id="t" type="target" position={Position.Top} />
      <Handle id="l" type="target" position={Position.Left} />
      <Handle id="r" type="source" position={Position.Right} />
      <Handle id="b" type="source" position={Position.Bottom} />
      <div className="avatar">
        {photo ? <img src={photo} alt="" draggable={false} /> : <span>{(person.firstName[0] ?? '?').toUpperCase()}</span>}
      </div>
      <div className="card-text">
        <strong>{fullName(person)}</strong>
        <span className="muted">
          {lifeSpan(person, lang)}
          {estimated && person.birth?.year == null ? ' ~' : ''}
          {!person.living && <TombstoneIcon />}
        </span>
        {level === 2 && (person.occupation || age != null) && (
          <span className="muted detail">
            {[person.occupation, age != null && person.birth?.year != null ? t('card.age', { n: age - person.birth.year }) : null].filter(Boolean).join(' · ')}
          </span>
        )}
      </div>
      {canEdit && (
        <>
          <button className="add-btn top nodrag nopan" title={t('panel.addParent')} aria-label={t('panel.addParent')} onClick={(e) => { e.stopPropagation(); onAdd(person.id, 'PARENT') }}>
            <Plus size={12} />
          </button>
          <button className="add-btn right nodrag nopan" title={t('panel.addSpouse')} aria-label={t('panel.addSpouse')} onClick={(e) => { e.stopPropagation(); onAdd(person.id, 'SPOUSE') }}>
            <Plus size={12} />
          </button>
          <button className="add-btn bottom nodrag nopan" title={t('panel.addChild')} aria-label={t('panel.addChild')} onClick={(e) => { e.stopPropagation(); onAdd(person.id, 'CHILD') }}>
            <Plus size={12} />
          </button>
        </>
      )}
      {createPortal(
        <AnimatePresence>{hovered && !dragging && anchor && <HoverCard person={person} graph={graph} focusId={focusId} warnings={warnings} anchor={anchor} />}</AnimatePresence>,
        document.body,
      )}
      {tone === 'error' && <span className="badge warn" aria-label={t('warn.count', { n: warningCount })}>!</span>}
      {tone === 'doubt' && (
        <Popover width={260} position="bottom" withArrow shadow="md" withinPortal>
          <Popover.Target>
            <button className="badge doubt nodrag nopan" aria-label={t('warn.confirmTitle')} title={t('warn.confirmTitle')} onClick={(e) => e.stopPropagation()}>
              ?
            </button>
          </Popover.Target>
          <Popover.Dropdown onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
            <div className="confirm-doubt">
              <strong>{t('warn.confirmQuestion')}</strong>
              <ul>
                {doubts.map((w, i) => (
                  <li key={i}>{t(`warn.${w.code}`, { ...w.params, other: otherName(w) })}</li>
                ))}
              </ul>
              <Button size="xs" color="orange" onClick={() => doubts.forEach((w) => onConfirmWarning(w, true))}>
                {t('warn.confirmYes')}
              </Button>
            </div>
          </Popover.Dropdown>
        </Popover>
      )}
      {childCount > 0 && (
        <button
          type="button"
          className={`collapse nodrag nopan${collapsed ? ' is-collapsed' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onToggleCollapse(person.id)
          }}
          onDoubleClick={(e) => e.stopPropagation()}
          title={collapsed ? t('card.expand') : t('card.collapse')}
          aria-label={collapsed ? t('card.expand') : t('card.collapse')}
          aria-expanded={!collapsed}
        >
          {collapsed ? `+${childCount}` : '−'}
        </button>
      )}
    </motion.div>
  )
})
