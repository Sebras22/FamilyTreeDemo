import { ActionIcon, NativeSelect, TextInput } from '@mantine/core'
import { useState } from 'react'
import { api } from '@/shared/api/api'
import { useI18n } from '@/shared/i18n/i18n'
import PersonPicker from '../PersonPicker'
import { PersonLink } from './shared'
import type { RelationType } from '@/interfaces/api/RelationType'
import type { SectionProps } from '@/interfaces/components/SectionProps'

const RELATION_TYPES: RelationType[] = ['GODPARENT', 'WITNESS', 'GUARDIAN', 'OTHER']

export default function RelationsSection({ person, graph, treeId, canEdit, run, onSelect }: SectionProps) {
  const { t } = useI18n()
  const [relationType, setRelationType] = useState<RelationType>('GODPARENT')
  const [relationNote, setRelationNote] = useState('')
  const relations = graph.relationsOf.get(person.id) ?? []

  return (
    <section>
      <h3>{t('panel.relations')}</h3>
      {relations.length === 0 && <p className="muted">{t('panel.none')}</p>}
      <ul className="links">
        {relations.map((r) => {
          const outgoing = r.personId === person.id
          return (
            <li key={r.id}>
              <PersonLink graph={graph} id={outgoing ? r.relatedId : r.personId} onSelect={onSelect} />
              <span className="muted">
                {t(outgoing ? `relation.${r.type}` : `relation.${r.type}.inverse`)}
                {r.note && ` · ${r.note}`}
              </span>
              {canEdit && treeId != null && (
                <ActionIcon variant="subtle" color="red" size="lg" title={t('panel.unlink')} onClick={() => run(() => api.deleteRelation(treeId, r.id))}>
                  ×
                </ActionIcon>
              )}
            </li>
          )
        })}
      </ul>
      {canEdit && treeId != null && (
        <div className="stack tight">
          <div className="row">
            <NativeSelect value={relationType} onChange={(e) => setRelationType(e.target.value as RelationType)}>
              {RELATION_TYPES.map((x) => (
                <option key={x} value={x}>
                  {t(`relation.${x}`)}
                </option>
              ))}
            </NativeSelect>
            <TextInput value={relationNote} onChange={(e) => setRelationNote(e.target.value)} placeholder={t('panel.note')} maxLength={255} />
          </div>
          <PersonPicker
            persons={[...graph.persons.values()]}
            exclude={[person.id]}
            placeholder={t('panel.linkRelation')}
            onPick={(p) =>
              run(async () => {
                await api.addRelation(treeId, person.id, p.id, relationType, relationNote.trim() || null)
                setRelationNote('')
              })
            }
          />
        </div>
      )}
    </section>
  )
}
