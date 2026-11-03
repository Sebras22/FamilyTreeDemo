import { Button, Checkbox, NativeSelect, Tabs, TextInput, Textarea } from '@mantine/core'
import { useState } from 'react'
import { api, ApiError } from '@/shared/api/api'
import { fullName } from '@/domain/dates'
import { partnerOf } from '@/domain/graph'
import { useI18n } from '@/shared/i18n/i18n'
import Modal from '@/shared/ui/Modal'
import SexChoice from './SexChoice'
import PartialDateInput from './PartialDateInput'
import type { BirthKind } from '@/interfaces/api/BirthKind'
import type { LinkType } from '@/interfaces/api/LinkType'
import type { PDate } from '@/interfaces/api/PDate'
import type { PersonFormProps } from '@/interfaces/components/PersonFormProps'
import type { PersonInput } from '@/interfaces/api/PersonInput'
import type { Reliability } from '@/interfaces/api/Reliability'
import type { Sex } from '@/interfaces/api/Sex'
import type { Tab } from '@/interfaces/components/Tab'

const TABS: Tab[] = ['identity', 'life', 'details', 'notes']
const LINK_TYPES: LinkType[] = ['BIOLOGICAL', 'ADOPTIVE', 'STEP', 'FOSTER', 'LEGAL']
const BIRTH_KINDS: BirthKind[] = ['LIVE', 'STILLBORN', 'MISCARRIAGE']
const RELIABILITIES: Reliability[] = ['LOW', 'MEDIUM', 'HIGH']

export default function PersonForm({ treeId, graph, person, relate, onClose, onSaved }: PersonFormProps) {
  const { t } = useI18n()
  const anchor = relate?.anchor
  const kind = relate?.kind

  const suggestedLastName =
    person?.lastName ?? (kind === 'CHILD' && anchor?.sex !== 'FEMALE' ? anchor?.lastName : kind === 'PARENT' ? anchor?.lastName : '') ?? ''
  const existingParents =
    kind === 'PARENT' && anchor ? (graph.parentsOf.get(anchor.id) ?? []).map((l) => graph.persons.get(l.parentId)!).filter(Boolean) : []
  const anchorPartners =
    kind === 'CHILD' && anchor ? (graph.couplesOf.get(anchor.id) ?? []).map((c) => graph.persons.get(partnerOf(c, anchor.id))!).filter(Boolean) : []

  const [tab, setTab] = useState<Tab>('identity')
  const [firstName, setFirstName] = useState(person?.firstName ?? '')
  const [lastName, setLastName] = useState(suggestedLastName)
  const [sex, setSex] = useState<Sex | ''>(person?.sex ?? '')
  const [middleNames, setMiddleNames] = useState(person?.middleNames ?? '')
  const [birthName, setBirthName] = useState(person?.birthName ?? '')
  const [nickname, setNickname] = useState(person?.nickname ?? '')
  const [birth, setBirth] = useState<PDate | null>(person?.birth ?? null)
  const [birthPlace, setBirthPlace] = useState(person?.birthPlace ?? '')
  const [deceased, setDeceased] = useState(person?.deceased ?? false)
  const [death, setDeath] = useState<PDate | null>(person?.death ?? null)
  const [deathPlace, setDeathPlace] = useState(person?.deathPlace ?? '')
  const [birthKind, setBirthKind] = useState<BirthKind>(person?.birthKind ?? 'LIVE')
  const [twinGroup, setTwinGroup] = useState(person?.twinGroup ?? '')
  const [occupation, setOccupation] = useState(person?.occupation ?? '')
  const [biography, setBiography] = useState(person?.biography ?? '')
  const [source, setSource] = useState(person?.source ?? '')
  const [reliability, setReliability] = useState<Reliability | ''>(person?.sourceReliability ?? '')
  const [linkType, setLinkType] = useState<LinkType>('BIOLOGICAL')
  const [otherParentId, setOtherParentId] = useState<string>(anchorPartners.length === 1 ? String(anchorPartners[0].id) : '')
  const [partnerOfNew, setPartnerOfNew] = useState<string>(existingParents.length === 1 ? String(existingParents[0].id) : '')
  const [birthInvalid, setBirthInvalid] = useState(false)
  const [deathInvalid, setDeathInvalid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const blank = (s: string) => (s.trim() ? s.trim() : null)
  const hasDeath = deceased || death != null
  const identityOk = firstName.trim() !== '' && lastName.trim() !== '' && sex !== ''
  const datesOk = !birthInvalid && !(hasDeath && deathInvalid)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sex || !identityOk || !datesOk) return
    setError(null)
    setBusy(true)
    const input: PersonInput = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      sex,
      middleNames: blank(middleNames),
      birthName: blank(birthName),
      nickname: blank(nickname),
      birth,
      birthPlace: blank(birthPlace),
      death: hasDeath ? death : null,
      deathPlace: hasDeath ? blank(deathPlace) : null,
      deceased,
      birthKind,
      twinGroup: blank(twinGroup),
      occupation: blank(occupation),
      biography: blank(biography),
      source: blank(source),
      sourceReliability: reliability || null,
      relateTo: anchor && kind ? { personId: anchor.id, kind, linkType: kind === 'SPOUSE' ? undefined : linkType } : undefined,
    }
    try {
      const saved = person ? await api.updatePerson(person.id, input) : await api.createPerson(treeId, input)
      if (!person) {
        if (kind === 'CHILD' && otherParentId) {
          await api.addParentLink(treeId, Number(otherParentId), saved.id, linkType)
        }
        if (kind === 'PARENT' && partnerOfNew) {
          await api.addCouple(treeId, {
            person1Id: Number(partnerOfNew),
            person2Id: saved.id,
            type: 'MARRIAGE',
            start: null,
            startPlace: null,
            end: null,
            endReason: null,
          })
        }
      }
      onSaved(saved)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'))
      setBusy(false)
    }
  }

  const title = person
    ? t('form.editTitle', { name: fullName(person) })
    : anchor && kind
      ? t(`form.add.${kind}`, { name: fullName(anchor) })
      : t('form.addTitle')

  const tabProblem: Partial<Record<Tab, boolean>> = { identity: !identityOk, life: !datesOk }
  const lastTab = TABS[TABS.length - 1]

  return (
    <Modal title={title} onClose={onClose} wide>
      <form className="stack" onSubmit={submit}>
        {error && <div className="error">{error}</div>}

        <Tabs value={tab} onChange={(v) => v && setTab(v as Tab)}>
          <Tabs.List>
            {TABS.map((id) => (
              <Tabs.Tab key={id} value={id} color={tabProblem[id] ? 'red' : undefined} rightSection={tabProblem[id] ? <span aria-hidden="true">•</span> : undefined}>
                {t(`form.tab.${id}`)}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>

        {tab === 'identity' && (
          <div className="stack">
            <div className="grid2">
              <TextInput label={`${t('form.firstName')} *`} value={firstName} onChange={(e) => setFirstName(e.currentTarget.value)} required withAsterisk={false} maxLength={120} data-autofocus />
              <TextInput label={`${t('form.lastName')} *`} value={lastName} onChange={(e) => setLastName(e.currentTarget.value)} required withAsterisk={false} maxLength={120} />
            </div>

            <SexChoice value={sex} onChange={setSex} />

            {(kind === 'PARENT' || kind === 'CHILD') && (
              <NativeSelect
                label={t('form.linkType')}
                value={linkType}
                onChange={(e) => setLinkType(e.currentTarget.value as LinkType)}
                data={LINK_TYPES.map((l) => ({ value: l, label: t(`link.${l}`) }))}
              />
            )}

            {kind === 'CHILD' && anchorPartners.length > 0 && (
              <NativeSelect
                label={t('form.otherParent')}
                value={otherParentId}
                onChange={(e) => setOtherParentId(e.currentTarget.value)}
                data={[{ value: '', label: '—' }, ...anchorPartners.map((p) => ({ value: String(p.id), label: fullName(p) }))]}
              />
            )}

            {kind === 'PARENT' && existingParents.length > 0 && (
              <NativeSelect
                label={t('form.coupleWith')}
                value={partnerOfNew}
                onChange={(e) => setPartnerOfNew(e.currentTarget.value)}
                data={[{ value: '', label: '—' }, ...existingParents.map((p) => ({ value: String(p.id), label: fullName(p) }))]}
              />
            )}
          </div>
        )}

        {tab === 'life' && (
          <div className="stack">
            <div className="grid2">
              <PartialDateInput label={t('form.birth')} value={birth} onChange={setBirth} onInvalid={setBirthInvalid} />
              <TextInput label={t('form.birthPlace')} value={birthPlace} onChange={(e) => setBirthPlace(e.currentTarget.value)} maxLength={255} />
            </div>
            <Checkbox label={t('form.deceased')} checked={hasDeath} disabled={death != null} onChange={(e) => setDeceased(e.currentTarget.checked)} />
            {hasDeath && (
              <div className="grid2">
                <PartialDateInput label={t('form.death')} value={death} onChange={setDeath} onInvalid={setDeathInvalid} />
                <TextInput label={t('form.deathPlace')} value={deathPlace} onChange={(e) => setDeathPlace(e.currentTarget.value)} maxLength={255} />
              </div>
            )}
          </div>
        )}

        {tab === 'details' && (
          <div className="grid2">
            <TextInput label={t('form.middleNames')} value={middleNames} onChange={(e) => setMiddleNames(e.target.value)} maxLength={255} />
            <TextInput label={t('form.birthName')} value={birthName} onChange={(e) => setBirthName(e.target.value)} maxLength={120} />
            <TextInput label={t('form.nickname')} value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={120} />
            <TextInput label={t('form.occupation')} value={occupation} onChange={(e) => setOccupation(e.target.value)} maxLength={255} />
            <NativeSelect label={t('form.birthKind')} value={birthKind} onChange={(e) => setBirthKind(e.target.value as BirthKind)}>
                {BIRTH_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t(`birthKind.${k}`)}
                  </option>
                ))}
              </NativeSelect>
            <TextInput label={t('form.twinGroup')} value={twinGroup} onChange={(e) => setTwinGroup(e.target.value)} maxLength={40} placeholder={t('form.twinHint')} />
          </div>
        )}

        {tab === 'notes' && (
          <div className="stack">
            <Textarea label={t('form.biography')} value={biography} onChange={(e) => setBiography(e.target.value)} rows={6} maxLength={5000} />
            <div className="grid2">
              <TextInput label={t('form.source')} value={source} onChange={(e) => setSource(e.target.value)} maxLength={500} placeholder={t('form.sourceHint')} />
              <NativeSelect label={t('form.reliability')} value={reliability} onChange={(e) => setReliability(e.target.value as Reliability | '')}>
                  <option value="">—</option>
                  {RELIABILITIES.map((r) => (
                    <option key={r} value={r}>
                      {t(`reliability.${r}`)}
                    </option>
                  ))}
                </NativeSelect>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <Button variant="subtle" color="gray" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          {tab !== lastTab && (
            <Button variant="default" type="button" onClick={() => setTab(TABS[TABS.indexOf(tab) + 1])}>
              {t('wizard.next')}
            </Button>
          )}
          <Button type="submit" disabled={busy || !identityOk || !datesOk}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
