import { ActionIcon, NativeSelect } from '@mantine/core'
import { Pencil } from 'lucide-react'
import { formatDate, hasDate } from '@/domain/dates'
import { partnerOf } from '@/domain/graph'
import { api } from '@/shared/api/api'
import { useI18n } from '@/shared/i18n/i18n'
import PersonPicker from '../PersonPicker'
import { PersonLink } from './shared'
import type { LinkType } from '@/interfaces/api/LinkType'
import type { SectionProps } from '@/interfaces/components/SectionProps'
import type { UnionsSectionProps } from '@/interfaces/components/UnionsSectionProps'
import type { UnlinkButtonProps } from '@/interfaces/components/UnlinkButtonProps'

const LINK_TYPES: LinkType[] = ['BIOLOGICAL', 'ADOPTIVE', 'STEP', 'FOSTER', 'LEGAL']

function UnlinkButton({ onClick }: UnlinkButtonProps) {
  const { t } = useI18n()
  return (
    <ActionIcon variant="subtle" color="red" size="lg" title={t('panel.unlink')} onClick={onClick}>
      ×
    </ActionIcon>
  )
}

export function ParentsSection({ person, graph, treeId, canEdit, run, onSelect }: SectionProps) {
  const { t } = useI18n()
  const parents = graph.parentsOf.get(person.id) ?? []
  return (
    <section>
      <h3>{t('panel.parents')}</h3>
      {parents.length === 0 && <p className="muted">{t('panel.none')}</p>}
      <ul className="links">
        {parents.map((l) => (
          <li key={l.id}>
            <PersonLink graph={graph} id={l.parentId} onSelect={onSelect} />
            {canEdit && treeId != null ? (
              <>
                <NativeSelect size="xs" value={l.linkType} onChange={(e) => run(() => api.updateParentLink(treeId, l.id, e.target.value as LinkType))}>
                  {LINK_TYPES.map((x) => (
                    <option key={x} value={x}>
                      {t(`link.${x}`)}
                    </option>
                  ))}
                </NativeSelect>
                <UnlinkButton onClick={() => run(() => api.deleteParentLink(treeId, l.id))} />
              </>
            ) : (
              l.linkType !== 'BIOLOGICAL' && <span className="muted">{t(`link.${l.linkType}`)}</span>
            )}
          </li>
        ))}
      </ul>
      {canEdit && treeId != null && (
        <PersonPicker
          persons={[...graph.persons.values()]}
          exclude={[person.id, ...parents.map((l) => l.parentId)]}
          placeholder={t('panel.linkParent')}
          onPick={(p) => run(() => api.addParentLink(treeId, p.id, person.id, 'BIOLOGICAL'))}
        />
      )}
    </section>
  )
}

export function UnionsSection({ person, graph, treeId, canEdit, run, onSelect, onEditCouple }: UnionsSectionProps) {
  const { t, lang } = useI18n()
  const unions = graph.couplesOf.get(person.id) ?? []
  return (
    <section>
      <h3>{t('panel.unions')}</h3>
      {unions.length === 0 && <p className="muted">{t('panel.none')}</p>}
      <ul className="links">
        {unions.map((c) => {
          const when = [formatDate(c.start, lang), c.startPlace].filter(Boolean).join(', ')
          const end = hasDate(c.end) ? ` → ${formatDate(c.end, lang)}` : ''
          return (
            <li key={c.id}>
              <PersonLink graph={graph} id={partnerOf(c, person.id)} onSelect={onSelect} />
              <span className="muted">
                {t(`couple.${c.type}`)}
                {when && ` · ${when}`}
                {end}
                {c.endReason && ` (${t(`endReason.${c.endReason}`)})`}
              </span>
              {canEdit && treeId != null && (
                <>
                  <ActionIcon variant="subtle" color="gray" size="lg" title={t('common.edit')} onClick={() => onEditCouple(c)}>
                    <Pencil size={14} />
                  </ActionIcon>
                  <UnlinkButton onClick={() => run(() => api.deleteCouple(treeId, c.id))} />
                </>
              )}
            </li>
          )
        })}
      </ul>
      {canEdit && treeId != null && (
        <PersonPicker
          persons={[...graph.persons.values()]}
          exclude={[person.id, ...unions.map((c) => partnerOf(c, person.id))]}
          placeholder={t('panel.linkSpouse')}
          onPick={(p) =>
            run(() =>
              api.addCouple(treeId, {
                person1Id: person.id,
                person2Id: p.id,
                type: 'MARRIAGE',
                start: null,
                startPlace: null,
                end: null,
                endReason: null,
              }),
            )
          }
        />
      )}
    </section>
  )
}

export function ChildrenSection({ person, graph, treeId, canEdit, run, onSelect }: SectionProps) {
  const { t } = useI18n()
  const children = graph.childrenOf.get(person.id) ?? []
  return (
    <section>
      <h3>{t('panel.children')}</h3>
      {children.length === 0 && <p className="muted">{t('panel.none')}</p>}
      <ul className="links">
        {children.map((l) => (
          <li key={l.id}>
            <PersonLink graph={graph} id={l.childId} onSelect={onSelect} />
            {l.linkType !== 'BIOLOGICAL' && <span className="muted">{t(`link.${l.linkType}`)}</span>}
            {canEdit && treeId != null && <UnlinkButton onClick={() => run(() => api.deleteParentLink(treeId, l.id))} />}
          </li>
        ))}
      </ul>
      {canEdit && treeId != null && (
        <PersonPicker
          persons={[...graph.persons.values()]}
          exclude={[person.id, ...children.map((l) => l.childId)]}
          placeholder={t('panel.linkChild')}
          onPick={(p) => run(() => api.addParentLink(treeId, person.id, p.id, 'BIOLOGICAL'))}
        />
      )}
    </section>
  )
}
