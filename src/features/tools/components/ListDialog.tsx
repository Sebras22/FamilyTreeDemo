import { Anchor, Button, Checkbox, TextInput, Textarea } from '@mantine/core'
import { useMemo, useState } from 'react'
import { api, ApiError } from '@/shared/api/api'
import { formatDate, fullName } from '@/domain/dates'
import { useI18n } from '@/shared/i18n/i18n'
import { useDialogs } from '@/shared/ui/Dialogs'
import Modal from '@/shared/ui/Modal'
import type { ListDialogProps } from '@/interfaces/components/ListDialogProps'
import type { PersonInput } from '@/interfaces/api/PersonInput'
import type { Sex } from '@/interfaces/api/Sex'

const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

function parseSex(text: string | undefined): Sex {
  const s = (text ?? '').trim().toLowerCase()
  if (['h', 'm', 'homme', 'male', 'man'].includes(s)) return 'MALE'
  if (['f', 'femme', 'female', 'woman'].includes(s)) return 'FEMALE'
  return 'UNKNOWN'
}

export const emptyInput = (firstName: string, lastName: string, sex: Sex, year: number | null): PersonInput => ({
  firstName,
  lastName,
  sex,
  middleNames: null,
  birthName: null,
  nickname: null,
  birth: year ? { year, month: null, day: null, approximate: false } : null,
  birthPlace: null,
  death: null,
  deathPlace: null,
  deceased: false,
  birthKind: 'LIVE',
  twinGroup: null,
  occupation: null,
  biography: null,
  source: null,
  sourceReliability: null,
})

export default function ListDialog({ treeId, graph, canEdit, onChanged, onSelect, onClose }: ListDialogProps) {
  const { t, lang } = useI18n()
  const { confirm } = useDialogs()
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulk, setBulk] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const rows = useMemo(() => {
    const q = norm(filter.trim())
    return [...graph.persons.values()]
      .filter((p) => !q || norm(`${p.firstName} ${p.lastName}`).includes(q))
      .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName))
  }, [graph, filter])

  const toggle = (id: number) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const allSelected = rows.length > 0 && rows.every((p) => selected.has(p.id))

  const removeSelected = async () => {
    if (!(await confirm({ message: t('list.deleteConfirm', { n: selected.size }), confirmLabel: t('common.delete'), danger: true }))) return
    setBusy(true)
    try {
      await api.deletePersons(treeId, [...selected])
      setSelected(new Set())
      await onChanged()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  const addBulk = async () => {
    setError(null)
    const inputs: PersonInput[] = []
    const lines = bulk.split('\n').map((l) => l.trim()).filter(Boolean)
    for (const [i, line] of lines.entries()) {
      const parts = line.split(/[,;]/).map((s) => s.trim())
      const names = parts[0].split(/\s+/)
      if (names.length < 2) {
        setError(t('list.bulkInvalid', { line: i + 1 }))
        return
      }
      const year = parts[2] ? parseInt(parts[2], 10) : NaN
      inputs.push(emptyInput(names[0], names.slice(1).join(' '), parseSex(parts[1]), Number.isFinite(year) ? year : null))
    }
    if (inputs.length === 0) return
    setBusy(true)
    try {
      await api.createPersons(treeId, inputs)
      setBulk('')
      await onChanged()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={t('list.title', { n: graph.persons.size })} onClose={onClose} wide>
      <div className="stack">
        {error && <div className="error">{error}</div>}
        <div className="row">
          <TextInput value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t('list.filter')} />
          {canEdit && (
            <Button color="red" disabled={selected.size === 0 || busy} onClick={removeSelected}>
              {t('list.deleteSelected', { n: selected.size })}
            </Button>
          )}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {canEdit && (
                  <th>
                    <Checkbox checked={allSelected} aria-label={t('list.selectAll')} onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((p) => p.id)))} />
                  </th>
                )}
                <th>{t('list.name')}</th>
                <th>{t('form.birth')}</th>
                <th>{t('form.death')}</th>
                <th>{t('form.sex')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  {canEdit && (
                    <td>
                      <Checkbox checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={fullName(p)} />
                    </td>
                  )}
                  <td>
                    <Anchor component="button" type="button"

                      onClick={() => {
                        onSelect(p.id)
                        onClose()
                      }}
                    >
                      {fullName(p)}
                    </Anchor>
                  </td>
                  <td>{formatDate(p.birth, lang)}</td>
                  <td>{formatDate(p.death, lang)}</td>
                  <td>{t(`sex.${p.sex}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {canEdit && (
          <details className="more">
            <summary>{t('list.bulkAdd')}</summary>
            <div className="stack">
              <p className="muted">{t('list.bulkHelp')}</p>
              <Textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={5} placeholder={'Jean Dupont, H, 1950\nMarie Martin, F, 1952'} />
              <Button disabled={busy || !bulk.trim()} onClick={addBulk}>
                {t('list.bulkSubmit')}
              </Button>
            </div>
          </details>
        )}
      </div>
    </Modal>
  )
}
