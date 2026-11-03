import { Button, NativeSelect, TextInput } from '@mantine/core'
import { useState } from 'react'
import { api, ApiError } from '@/shared/api/api'
import { useI18n } from '@/shared/i18n/i18n'
import Modal from '@/shared/ui/Modal'
import PartialDateInput from './PartialDateInput'
import type { CoupleFormProps } from '@/interfaces/components/CoupleFormProps'
import type { CoupleType } from '@/interfaces/api/CoupleType'
import type { EndReason } from '@/interfaces/api/EndReason'
import type { PDate } from '@/interfaces/api/PDate'

const TYPES: CoupleType[] = ['MARRIAGE', 'PACS', 'PARTNERSHIP', 'OTHER']
const REASONS: EndReason[] = ['DIVORCE', 'SEPARATION', 'DEATH']

export default function CoupleForm({ treeId, couple, title, onClose, onSaved }: CoupleFormProps) {
  const { t } = useI18n()
  const [type, setType] = useState<CoupleType>(couple.type)
  const [start, setStart] = useState<PDate | null>(couple.start)
  const [startPlace, setStartPlace] = useState(couple.startPlace ?? '')
  const [end, setEnd] = useState<PDate | null>(couple.end)
  const [reason, setReason] = useState<EndReason | ''>(couple.endReason ?? '')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.updateCouple(treeId, couple.id, {
        person1Id: couple.person1Id,
        person2Id: couple.person2Id,
        type,
        start,
        startPlace: startPlace.trim() || null,
        end,
        endReason: reason || null,
      })
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'))
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        {error && <div className="error">{error}</div>}
        <NativeSelect label={t('couple.type')} value={type} onChange={(e) => setType(e.target.value as CoupleType)}>
            {TYPES.map((c) => (
              <option key={c} value={c}>
                {t(`couple.${c}`)}
              </option>
            ))}
          </NativeSelect>
        <PartialDateInput label={t('couple.start')} value={start} onChange={setStart} />
        <TextInput label={t('couple.place')} value={startPlace} onChange={(e) => setStartPlace(e.target.value)} maxLength={255} />
        <PartialDateInput label={t('couple.end')} value={end} onChange={setEnd} />
        <NativeSelect label={t('couple.endReason')} value={reason} onChange={(e) => setReason(e.target.value as EndReason | '')}>
            <option value="">—</option>
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {t(`endReason.${r}`)}
              </option>
            ))}
          </NativeSelect>
        <div className="modal-actions">
          <Button variant="subtle" color="gray" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit">
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
