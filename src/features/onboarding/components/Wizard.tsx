import { ActionIcon, Button, NativeSelect, TextInput, Textarea } from '@mantine/core'
import SexChoice from '@/features/persons/components/SexChoice'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { api, ApiError } from '@/shared/api/api'
import { useI18n } from '@/shared/i18n/i18n'
import { Illustration } from '@/shared/ui/Illustrations'
import { emptyInput } from '@/features/tools/components/ListDialog'
import type { IllustrationKind } from '@/interfaces/ui/IllustrationKind'
import type { Mini } from '@/interfaces/components/Mini'
import type { MiniFieldsProps } from '@/interfaces/components/MiniFieldsProps'
import type { Sex } from '@/interfaces/api/Sex'
import type { WizardProps } from '@/interfaces/components/WizardProps'

const blankMini: Mini = { first: '', last: '', year: '' }
const year = (m: Mini) => (m.year.trim() && Number.isFinite(parseInt(m.year, 10)) ? parseInt(m.year, 10) : null)
const STEP_ART: IllustrationKind[] = ['family', 'tree', 'share']

function MiniFields({ value, onChange, label }: MiniFieldsProps) {
  const { t } = useI18n()
  return (
    <fieldset className="mini">
      <legend>{label}</legend>
      <div className="grid3">
        <TextInput placeholder={t('form.firstName')} value={value.first} onChange={(e) => onChange({ ...value, first: e.target.value })} />
        <TextInput placeholder={t('form.lastName')} value={value.last} onChange={(e) => onChange({ ...value, last: e.target.value })} />
        <TextInput type="number" placeholder={t('wizard.birthYear')} value={value.year} onChange={(e) => onChange({ ...value, year: e.target.value })} />
      </div>
    </fieldset>
  )
}

export default function Wizard({ treeId, onDone, onClose }: WizardProps) {
  const { t } = useI18n()
  const [step, setStep] = useState(0)
  const [me, setMe] = useState<Mini>(blankMini)
  const [mySex, setMySex] = useState<Sex | ''>('')
  const [meId, setMeId] = useState<number | null>(null)
  const [father, setFather] = useState<Mini>(blankMini)
  const [mother, setMother] = useState<Mini>(blankMini)
  const [spouse, setSpouse] = useState<Mini>(blankMini)
  const [spouseSex, setSpouseSex] = useState<Sex>('UNKNOWN')
  const [children, setChildren] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const run = async (fn: () => Promise<void>) => {
    setError(null)
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  const createMe = () =>
    run(async () => {
      const created = await api.createPerson(treeId, emptyInput(me.first.trim(), me.last.trim(), mySex as Sex, year(me)))
      setMeId(created.id)
      setFather((f) => ({ ...f, last: f.last || me.last }))
      setStep(1)
    })

  const createParents = () =>
    run(async () => {
      if (meId == null) return
      let fatherId: number | null = null
      let motherId: number | null = null
      if (father.first.trim()) {
        const p = emptyInput(father.first.trim(), (father.last || me.last).trim(), 'MALE', year(father))
        fatherId = (await api.createPerson(treeId, { ...p, relateTo: { personId: meId, kind: 'PARENT' } })).id
      }
      if (mother.first.trim()) {
        const p = emptyInput(mother.first.trim(), (mother.last || me.last).trim(), 'FEMALE', year(mother))
        motherId = (await api.createPerson(treeId, { ...p, relateTo: { personId: meId, kind: 'PARENT' } })).id
      }
      if (fatherId && motherId) {
        await api.addCouple(treeId, { person1Id: fatherId, person2Id: motherId, type: 'MARRIAGE', start: null, startPlace: null, end: null, endReason: null })
      }
      setStep(2)
    })

  const finish = () =>
    run(async () => {
      if (meId == null) return
      let spouseId: number | null = null
      if (spouse.first.trim()) {
        const p = emptyInput(spouse.first.trim(), spouse.last.trim() || '?', spouseSex, year(spouse))
        spouseId = (await api.createPerson(treeId, { ...p, relateTo: { personId: meId, kind: 'SPOUSE' } })).id
      }
      for (const line of children.split('\n').map((l) => l.trim()).filter(Boolean)) {
        const [first, y] = line.split(/[,;]/).map((s) => s.trim())
        const born = y && Number.isFinite(parseInt(y, 10)) ? parseInt(y, 10) : null
        const p = emptyInput(first, me.last.trim(), 'UNKNOWN', born)
        const child = await api.createPerson(treeId, { ...p, relateTo: { personId: meId, kind: 'CHILD' } })
        if (spouseId) await api.addParentLink(treeId, spouseId, child.id, 'BIOLOGICAL')
      }
      await onDone(meId)
    })

  return (
    <motion.div className="wizard-screen" role="dialog" aria-modal="true" aria-label={t('wizard.title', { step: step + 1 })} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      <aside className="wizard-art">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, scale: 0.92, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3 }}>
            <Illustration kind={STEP_ART[step]} />
          </motion.div>
        </AnimatePresence>
        <h2>{t(`wizard.art.${step}`)}</h2>
        <p>{t(`wizard.artText.${step}`)}</p>
      </aside>

      <main className="wizard-form">
        <ActionIcon variant="subtle" color="gray" size="lg" className="wizard-close" onClick={onClose} aria-label={t('common.close')}>
          <X size={22} />
        </ActionIcon>
        <div className="wizard-progress" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className={i <= step ? 'on' : ''} />
          ))}
        </div>
        <p className="eyebrow">{t('wizard.title', { step: step + 1 })}</p>

        <AnimatePresence mode="wait">
          <motion.div key={step} className="stack" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
            {error && <div className="error">{error}</div>}

            {step === 0 && (
              <>
                <h1>{t('wizard.me')}</h1>
                <MiniFields label={t('wizard.you')} value={me} onChange={setMe} />
                <SexChoice value={mySex} onChange={setMySex} />
                <div className="modal-actions">
                  <Button size="lg" className="big-action" disabled={busy || !me.first.trim() || !me.last.trim() || !mySex} onClick={createMe}>
                    {t('wizard.next')}
                  </Button>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h1>{t('wizard.parents')}</h1>
                <MiniFields label={t('wizard.father')} value={father} onChange={setFather} />
                <MiniFields label={t('wizard.mother')} value={mother} onChange={setMother} />
                <div className="modal-actions">
                  <Button variant="subtle" color="gray" onClick={() => setStep(2)}>
                    {t('wizard.skip')}
                  </Button>
                  <Button size="lg" className="big-action" disabled={busy} onClick={createParents}>
                    {t('wizard.next')}
                  </Button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h1>{t('wizard.family')}</h1>
                <MiniFields label={t('wizard.spouse')} value={spouse} onChange={setSpouse} />
                <NativeSelect label={t('wizard.spouseSex')} value={spouseSex} onChange={(e) => setSpouseSex(e.target.value as Sex)}>
                    <option value="UNKNOWN">{t('sex.UNKNOWN')}</option>
                    <option value="MALE">{t('sex.MALE')}</option>
                    <option value="FEMALE">{t('sex.FEMALE')}</option>
                  </NativeSelect>
                <Textarea label={t('wizard.children')} value={children} onChange={(e) => setChildren(e.target.value)} rows={4} placeholder={'Léa, 2010\nHugo, 2013'} />
                <div className="modal-actions">
                  <Button size="lg" className="big-action" disabled={busy} onClick={finish}>
                    {t('wizard.finish')}
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </motion.div>
  )
}
