import { Button } from '@mantine/core'
import { Pencil, Plus, Target, Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { fullName } from '@/domain/dates'
import { useI18n } from '@/shared/i18n/i18n'
import type { ContextMenuProps } from '@/interfaces/components/ContextMenuProps'
import type { RelateKind } from '@/interfaces/components/RelateKind'

const ADD_LABELS: Record<RelateKind, string> = { PARENT: 'panel.addParent', SPOUSE: 'panel.addSpouse', CHILD: 'panel.addChild' }

export default function ContextMenu({ person, x, y, canEdit, onClose, onFocus, onEdit, onAdd, onDelete }: ContextMenuProps) {
  const { t } = useI18n()

  useEffect(() => {
    const close = (e: Event) => {
      if ((e.target as Element | null)?.closest?.('.context-menu')) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const events = ['pointerdown', 'mousedown', 'touchstart', 'wheel'] as const
    events.forEach((name) => window.addEventListener(name, close, { capture: true, passive: true }))
    window.addEventListener('keydown', onKey)
    return () => {
      events.forEach((name) => window.removeEventListener(name, close, { capture: true }))
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const run = (action: () => void) => () => {
    onClose()
    action()
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- empêche la fermeture du menu au clic interne
    <ul className="context-menu" style={{ left: Math.min(x, window.innerWidth - 220), top: Math.min(y, window.innerHeight - 260) }} onMouseDown={(e) => e.stopPropagation()}>
      <li className="context-title">{fullName(person)}</li>
      <li>
        <Button variant="subtle" color="gray" onClick={run(() => onFocus(person.id))}>
          <Target size={16} /> {t('panel.center')}
        </Button>
      </li>
      {canEdit && (
        <>
          <li>
            <Button variant="subtle" color="gray" onClick={run(() => onEdit(person))}>
              <Pencil size={16} /> {t('common.edit')}
            </Button>
          </li>
          {(Object.keys(ADD_LABELS) as RelateKind[]).map((kind) => (
            <li key={kind}>
              <Button variant="subtle" color="gray" onClick={run(() => onAdd(person.id, kind))}>
                <Plus size={16} /> {t(ADD_LABELS[kind])}
              </Button>
            </li>
          ))}
          <li>
            <Button variant="subtle" color="red" onClick={run(() => onDelete(person))}>
              <Trash2 size={16} /> {t('common.delete')}
            </Button>
          </li>
        </>
      )}
    </ul>
  )
}
