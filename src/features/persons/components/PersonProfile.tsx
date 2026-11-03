import { Button } from '@mantine/core'
import { ArrowLeft, Pencil } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDate, fullName, hasDate, lifeSpan } from '@/domain/dates'
import { partnerOf } from '@/domain/graph'
import { useI18n } from '@/shared/i18n/i18n'
import { kinship, kinshipLabel } from '@/domain/kinship'
import { usePhoto } from '@/features/persons/hooks/photos'
import { TombstoneIcon } from '@/shared/ui/Icons'
import Comments from './Comments'
import PersonPicker from './PersonPicker'
import type { MiniCardProps } from '@/interfaces/components/MiniCardProps'
import type { Person } from '@/interfaces/api/Person'
import type { PersonProfileProps } from '@/interfaces/components/PersonProfileProps'
import type { TimelineEvent } from '@/interfaces/components/TimelineEvent'

function MiniCard({ person, to, hint }: MiniCardProps) {
  const { lang } = useI18n()
  const photo = usePhoto(person.id, person.hasPhoto)
  return (
    <Link to={to} className={`mini-card sex-${person.sex.toLowerCase()}`}>
      <span className="avatar">{photo ? <img src={photo} alt="" /> : <span>{(person.firstName[0] ?? '?').toUpperCase()}</span>}</span>
      <span className="mini-text">
        <strong>{fullName(person)}</strong>
        <span className="muted">{[hint, lifeSpan(person, lang)].filter(Boolean).join(' · ')}</span>
      </span>
    </Link>
  )
}

export default function PersonProfile({ graph, person, role, personUrl, backTo, backLabel, onEdit }: PersonProfileProps) {
  const { t, lang } = useI18n()
  const photo = usePhoto(person.id, person.hasPhoto)
  const canEdit = role === 'EDITOR' || role === 'OWNER'
  const [compareId, setCompareId] = useState<number | null>(null)

  const name = (id: number) => {
    const p = graph.persons.get(id)
    return p ? fullName(p) : '?'
  }

  const parents = (graph.parentsOf.get(person.id) ?? []).map((l) => ({ link: l, person: graph.persons.get(l.parentId) })).filter((x) => x.person)
  const children = (graph.childrenOf.get(person.id) ?? []).map((l) => ({ link: l, person: graph.persons.get(l.childId) })).filter((x) => x.person)
  const unions = graph.couplesOf.get(person.id) ?? []
  const siblings = useMemo(() => {
    const ids = new Set<number>()
    for (const l of graph.parentsOf.get(person.id) ?? []) {
      for (const c of graph.childrenOf.get(l.parentId) ?? []) if (c.childId !== person.id) ids.add(c.childId)
    }
    return [...ids]
      .map((id) => graph.persons.get(id))
      .filter((p): p is Person => !!p)
      .sort((a, b) => (a.birth?.year ?? 9999) - (b.birth?.year ?? 9999))
  }, [graph, person.id])
  const relations = graph.relationsOf.get(person.id) ?? []

  const timeline = useMemo(() => {
    const events: TimelineEvent[] = []
    const push = (key: string, year: number | null | undefined, label: string, detail?: string) =>
      year != null && events.push({ key, sort: year, year: String(year), label, detail })
    push('birth', person.birth?.year, t('tl.birth'), [formatDate(person.birth, lang), person.birthPlace].filter(Boolean).join(' — '))
    for (const c of unions) {
      const other = name(partnerOf(c, person.id))
      push(`u${c.id}`, c.start?.year, t('tl.union', { name: other }), [formatDate(c.start, lang), c.startPlace].filter(Boolean).join(' — '))
      if (c.endReason || hasDate(c.end)) push(`e${c.id}`, c.end?.year, t('tl.unionEnd', { name: other }), c.endReason ? t(`endReason.${c.endReason}`) : undefined)
    }
    for (const { person: child } of children) {
      if (child) push(`c${child.id}`, child.birth?.year, t('tl.child', { name: fullName(child) }), formatDate(child.birth, lang))
    }
    push('death', person.death?.year, t('tl.death'), [formatDate(person.death, lang), person.deathPlace].filter(Boolean).join(' — '))
    return events.sort((a, b) => a.sort - b.sort)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person, unions, children, lang])

  const compare = compareId != null ? graph.persons.get(compareId) : undefined
  const relation = compare ? kinship(graph, compare.id, person.id) : null

  const facts: [string, string | null][] = [
    [t('form.middleNames'), person.middleNames],
    [t('form.birthName'), person.birthName],
    [t('form.nickname'), person.nickname],
    [t('form.occupation'), person.occupation],
    [t('form.sex'), t(`sex.${person.sex}`)],
    [t('form.birthKind'), person.birthKind !== 'LIVE' ? t(`birthKind.${person.birthKind}`) : null],
    [t('form.twinGroup'), person.twinGroup],
  ]

  return (
    <div className="profile">
      <motion.section className="profile-hero" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Link to={backTo} className="back-link">
          <ArrowLeft size={16} /> {backLabel}
        </Link>
        <div className="profile-id">
          <div className={`avatar xl sex-${person.sex.toLowerCase()}`}>
            {photo ? <img src={photo} alt="" /> : <span>{(person.firstName[0] ?? '?').toUpperCase()}</span>}
          </div>
          <div>
            <h1>{fullName(person)}</h1>
            <p className="lead muted">
              {lifeSpan(person, lang)} {!person.living && <TombstoneIcon size={16} />}
            </p>
            {person.birthPlace && <p className="muted">{person.birthPlace}</p>}
            {canEdit && onEdit && (
              <Button variant="default" onClick={() => onEdit(person)}>
                <Pencil size={16} /> {t('common.edit')}
              </Button>
            )}
          </div>
        </div>
      </motion.section>

      <div className="profile-grid">
        <div className="profile-main">
          <section className="card">
            <h2>{t('profile.lifeTimeline')}</h2>
            {timeline.length === 0 ? (
              <p className="muted">{t('profile.noEvents')}</p>
            ) : (
              <ol className="life-timeline">
                {timeline.map((e) => (
                  <li key={e.key}>
                    <span className="year">{e.year}</span>
                    <div>
                      <strong>{e.label}</strong>
                      {e.detail && <span className="muted"> {e.detail}</span>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="card">
            <h2>{t('panel.identity')}</h2>
            <dl className="facts">
              {facts
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
            </dl>
            {person.biography && <p className="bio">{person.biography}</p>}
            {person.source && (
              <p className="muted">
                {t('form.source')} : {person.source}
                {person.sourceReliability && ` (${t(`reliability.${person.sourceReliability}`)})`}
              </p>
            )}
          </section>

          <section className="card">
            <h2>{t('profile.kinship')}</h2>
            <PersonPicker persons={[...graph.persons.values()]} exclude={[person.id]} placeholder={t('profile.kinshipPick')} onPick={(p) => setCompareId(p.id)} />
            {compare && (
              <p className="kinship">
                {relation
                  ? t('panel.kinship', { name: fullName(compare), relation: kinshipLabel(relation, person.sex, lang) })
                  : t('profile.noKinship', { name: fullName(compare) })}
              </p>
            )}
          </section>

          {role != null && (
            <section className="card">
              <Comments person={person} canWrite={canEdit} />
            </section>
          )}
        </div>

        <aside className="profile-side">
          <section className="card">
            <h2>{t('panel.parents')}</h2>
            {parents.length === 0 ? <p className="muted">{t('panel.none')}</p> : parents.map(({ link, person: p }) => <MiniCard key={link.id} person={p!} to={personUrl(p!.id)} hint={link.linkType !== 'BIOLOGICAL' ? t(`link.${link.linkType}`) : undefined} />)}
          </section>
          {unions.length > 0 && (
            <section className="card">
              <h2>{t('panel.unions')}</h2>
              {unions.map((c) => {
                const other = graph.persons.get(partnerOf(c, person.id))
                return other ? <MiniCard key={c.id} person={other} to={personUrl(other.id)} hint={t(`couple.${c.type}`)} /> : null
              })}
            </section>
          )}
          {siblings.length > 0 && (
            <section className="card">
              <h2>{t('profile.siblings')}</h2>
              {siblings.map((p) => (
                <MiniCard key={p.id} person={p} to={personUrl(p.id)} />
              ))}
            </section>
          )}
          <section className="card">
            <h2>{t('panel.children')}</h2>
            {children.length === 0 ? <p className="muted">{t('panel.none')}</p> : children.map(({ link, person: p }) => <MiniCard key={link.id} person={p!} to={personUrl(p!.id)} hint={link.linkType !== 'BIOLOGICAL' ? t(`link.${link.linkType}`) : undefined} />)}
          </section>
          {relations.length > 0 && (
            <section className="card">
              <h2>{t('panel.relations')}</h2>
              {relations.map((r) => {
                const outgoing = r.personId === person.id
                const other = graph.persons.get(outgoing ? r.relatedId : r.personId)
                return other ? <MiniCard key={r.id} person={other} to={personUrl(other.id)} hint={t(outgoing ? `relation.${r.type}` : `relation.${r.type}.inverse`)} /> : null
              })}
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
