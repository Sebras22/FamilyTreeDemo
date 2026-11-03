import { ActionIcon, Button } from '@mantine/core'
import { ExternalLink, Pencil, Plus, Target, Trash2, UserCheck, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '@/shared/api/api'
import { fullName, lifeSpan } from '@/domain/dates'
import { nameOf, partnerOf } from '@/domain/graph'
import { useI18n } from '@/shared/i18n/i18n'
import { kinship, kinshipLabel } from '@/domain/kinship'
import { usePhoto } from '@/features/persons/hooks/photos'
import Comments from './Comments'
import CoupleForm from './CoupleForm'
import IdentitySection from './panel/IdentitySection'
import PhotoSection from './panel/PhotoSection'
import RelationsSection from './panel/RelationsSection'
import { ChildrenSection, ParentsSection, UnionsSection } from './panel/FamilySections'
import WarningsSections from './panel/WarningsSections'
import { TombstoneIcon } from '@/shared/ui/Icons'
import type { Couple } from '@/interfaces/api/Couple'
import type { PersonPanelProps } from '@/interfaces/components/PersonPanelProps'

export default function PersonPanel(props: PersonPanelProps) {
  const { treeId, person, graph, warnings, onConfirmWarning, focusId, role, selfId, onSetSelf, personUrl, onClose, onEdit, onAdd, onDelete, onFocus, onSelect, onChanged } = props
  const { t, lang } = useI18n()
  const canEdit = role === 'EDITOR' || role === 'OWNER'
  const photo = usePhoto(person.id, person.hasPhoto)
  const [error, setError] = useState<string | null>(null)
  const [editingCouple, setEditingCouple] = useState<Couple | null>(null)

  useEffect(() => setError(null), [person.id])

  const run = useCallback(
    async (fn: () => Promise<unknown>) => {
      setError(null)
      try {
        await fn()
        await onChanged()
      } catch (e) {
        setError(e instanceof ApiError ? e.message : t('common.error'))
      }
    },
    [onChanged, t],
  )

  const relation = focusId != null && focusId !== person.id ? kinship(graph, focusId, person.id) : null
  const focusPerson = focusId != null ? graph.persons.get(focusId) : undefined
  const section = { person, graph, treeId, canEdit, run, onSelect }

  return (
    <motion.aside
      className="panel"
      initial={window.matchMedia('(max-width: 800px)').matches ? { y: 80, opacity: 0 } : { x: 40, opacity: 0 }}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
    >
      <header className="panel-header">
        <div className="avatar large">
          {photo ? <img src={photo} alt="" /> : <span>{(person.firstName[0] ?? '?').toUpperCase()}</span>}
        </div>
        <div className="panel-title">
          <h2>{fullName(person)}</h2>
          <div className="muted">
            {lifeSpan(person, lang)}
            {!person.living && <TombstoneIcon />}
          </div>
        </div>
        <ActionIcon variant="subtle" color="gray" size="lg" onClick={onClose} aria-label={t('common.close')}>
          <X size={18} />
        </ActionIcon>
      </header>

      <div className="panel-body">
        {error && <div className="error">{error}</div>}

        <div className="row wrap">
          <Button variant="default" onClick={() => onFocus(person.id)}><Target size={16} /> {t('panel.center')}</Button>
          {canEdit && <Button variant="default" onClick={() => onEdit(person)}><Pencil size={16} /> {t('common.edit')}</Button>}
          {personUrl && (
            <Button variant="default" component={Link} to={personUrl(person.id)}>
              <ExternalLink size={16} /> {t('panel.openPage')}
            </Button>
          )}
          {onSetSelf && role != null && (
            <Button variant="default" onClick={() => run(() => onSetSelf(selfId === person.id ? null : person.id))}>
              <UserCheck size={16} /> {selfId === person.id ? t('panel.notMe') : t('panel.itsMe')}
            </Button>
          )}
        </div>
        {canEdit && (
          <div className="row wrap">
            <Button variant="default" onClick={() => onAdd(person, 'PARENT')}><Plus size={16} /> {t('panel.addParent')}</Button>
            <Button variant="default" onClick={() => onAdd(person, 'SPOUSE')}><Plus size={16} /> {t('panel.addSpouse')}</Button>
            <Button variant="default" onClick={() => onAdd(person, 'CHILD')}><Plus size={16} /> {t('panel.addChild')}</Button>
          </div>
        )}

        {person.floating && <div className="notice">{t('panel.floating')}</div>}

        <WarningsSections warnings={warnings} graph={graph} onConfirmWarning={onConfirmWarning} />

        {relation && focusPerson && (
          <p className="kinship">
            {t('panel.kinship', { name: fullName(focusPerson), relation: kinshipLabel(relation, person.sex, lang) })}
          </p>
        )}

        <IdentitySection person={person} />
        <ParentsSection {...section} />
        <UnionsSection {...section} onEditCouple={setEditingCouple} />
        <ChildrenSection {...section} />
        <RelationsSection {...section} />
        {canEdit && <PhotoSection person={person} run={run} />}
        {role != null && <Comments person={person} canWrite={canEdit} />}

        {canEdit && (
          <section>
            <Button color="red" onClick={() => onDelete(person)}>
              <Trash2 size={16} /> {t('panel.delete')}
            </Button>
          </section>
        )}
      </div>

      {editingCouple && treeId != null && (
        <CoupleForm
          treeId={treeId}
          couple={editingCouple}
          title={`${fullName(person)} & ${nameOf(graph, partnerOf(editingCouple, person.id))}`}
          onClose={() => setEditingCouple(null)}
          onSaved={async () => {
            setEditingCouple(null)
            await onChanged()
          }}
        />
      )}
    </motion.aside>
  )
}
