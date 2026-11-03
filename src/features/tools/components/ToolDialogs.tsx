import { Button, Radio } from '@mantine/core'
import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '@/shared/api/api'
import { formatDate, fullName } from '@/domain/dates'
import { useI18n } from '@/shared/i18n/i18n'
import { EmptyState } from '@/shared/ui/Illustrations'
import { useDialogs } from '@/shared/ui/Dialogs'
import Modal from '@/shared/ui/Modal'
import type { DuplicateGroup } from '@/interfaces/api/DuplicateGroup'
import type { DuplicatesDialogProps } from '@/interfaces/components/DuplicatesDialogProps'
import type { HistoryDialogProps } from '@/interfaces/components/HistoryDialogProps'
import type { HistoryItem } from '@/interfaces/api/HistoryItem'
import type { Person } from '@/interfaces/api/Person'
import type { TrashDialogProps } from '@/interfaces/components/TrashDialogProps'

const errorText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback)

export function DuplicatesDialog({ treeId, graph, onChanged, onClose }: DuplicatesDialogProps) {
  const { t, lang } = useI18n()
  const [groups, setGroups] = useState<DuplicateGroup[] | null>(null)
  const [keep, setKeep] = useState<Record<number, number>>({})
  const [dismissed, setDismissed] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setGroups(await api.duplicates(treeId))
    } catch (e) {
      setError(errorText(e, t('common.error')))
    }
  }, [treeId, t])

  useEffect(() => {
    load()
  }, [load])

  const merge = async (index: number, group: DuplicateGroup) => {
    const keepId = keep[index] ?? group.personIds[0]
    try {
      for (const id of group.personIds.filter((x) => x !== keepId)) await api.mergePersons(keepId, id)
      await onChanged()
      await load()
    } catch (e) {
      setError(errorText(e, t('common.error')))
    }
  }

  const visible = (groups ?? []).map((g, i) => ({ g, i })).filter(({ g }) => !dismissed.has(g.personIds[0]))

  return (
    <Modal title={t('dup.title')} onClose={onClose} wide>
      <div className="stack">
        <p className="muted">{t('dup.help')}</p>
        {error && <div className="error">{error}</div>}
        {groups === null && <p className="muted">{t('common.loading')}</p>}
        {groups && visible.length === 0 && <EmptyState kind="family" title={t('dup.none')} text={t('dup.noneText')} />}
        {visible.map(({ g, i }) => (
          <section key={g.personIds.join('-')} className="card">
            <ul className="links">
              {g.personIds.map((id) => {
                const p = graph.persons.get(id)
                if (!p) return null
                return (
                  <li key={id}>
                    <Radio label={<><span> <strong>{fullName(p)}</strong>{' '} <span className="muted"> {formatDate(p.birth, lang)} {p.birthPlace ?? ''} </span> </span></>} name={`keep-${i}`} checked={(keep[i] ?? g.personIds[0]) === id} onChange={() => setKeep({ ...keep, [i]: id })} />
                  </li>
                )
              })}
            </ul>
            <div className="row">
              <Button onClick={() => merge(i, g)}>
                {t('dup.merge')}
              </Button>
              <Button variant="subtle" color="gray" onClick={() => setDismissed(new Set(dismissed).add(g.personIds[0]))}>
                {t('dup.ignore')}
              </Button>
            </div>
          </section>
        ))}
      </div>
    </Modal>
  )
}

export function TrashDialog({ treeId, role, onChanged, onClose }: TrashDialogProps) {
  const { t, lang } = useI18n()
  const { confirm } = useDialogs()
  const [items, setItems] = useState<Person[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setItems(await api.trash(treeId))
    } catch (e) {
      setError(errorText(e, t('common.error')))
    }
  }, [treeId, t])

  useEffect(() => {
    load()
  }, [load])

  const act = async (fn: () => Promise<unknown>) => {
    try {
      await fn()
      await load()
      await onChanged()
    } catch (e) {
      setError(errorText(e, t('common.error')))
    }
  }

  return (
    <Modal title={t('trash.title')} onClose={onClose}>
      <div className="stack">
        <p className="muted">{t('trash.help')}</p>
        {error && <div className="error">{error}</div>}
        {items === null && <p className="muted">{t('common.loading')}</p>}
        {items && items.length === 0 && <EmptyState kind="album" title={t('trash.empty')} text={t('trash.emptyText')} />}
        <ul className="links">
          {items?.map((p) => (
            <li key={p.id}>
              <span>
                {fullName(p)} <span className="muted">{formatDate(p.birth, lang)}</span>
              </span>
              <Button variant="default" onClick={() => act(() => api.restorePerson(p.id))}>{t('trash.restore')}</Button>
              {role === 'OWNER' && (
                <Button variant="subtle" color="red"

                  onClick={async () => (await confirm({ message: t('trash.purgeConfirm', { name: fullName(p) }), confirmLabel: t('trash.purge'), danger: true })) && act(() => api.purgePerson(p.id))}
                >
                  {t('trash.purge')}
                </Button>
              )}
            </li>
          ))}
        </ul>
        {role === 'OWNER' && items && items.length > 0 && (
          <Button color="red" onClick={async () => (await confirm({ message: t('trash.emptyConfirm'), confirmLabel: t('trash.emptyAll'), danger: true })) && act(() => api.emptyTrash(treeId))}>
            {t('trash.emptyAll')}
          </Button>
        )}
      </div>
    </Modal>
  )
}

export function HistoryDialog({ treeId, onClose }: HistoryDialogProps) {
  const { t, lang } = useI18n()
  const [items, setItems] = useState<HistoryItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.history(treeId).then(setItems).catch((e) => setError(errorText(e, t('common.error'))))
  }, [treeId, t])

  return (
    <Modal title={t('history.title')} onClose={onClose} wide>
      {error && <div className="error">{error}</div>}
      {items === null && !error && <p className="muted">{t('common.loading')}</p>}
      {items && items.length === 0 && <EmptyState kind="chart" title={t('history.empty')} text={t('history.emptyText')} />}
      <ul className="history">
        {items?.map((h) => (
          <li key={h.id}>
            <span className="muted">{new Date(h.createdAt).toLocaleString(lang)}</span>
            <span className={`tag ${h.action.toLowerCase()}`}>{t(`history.${h.action}`)}</span>
            <strong>{h.label}</strong>
            <span className="muted">{h.userName ?? t('panel.deletedUser')}</span>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
