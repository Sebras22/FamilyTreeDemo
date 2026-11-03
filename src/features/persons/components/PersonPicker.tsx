import { Button, TextInput } from '@mantine/core'
import { useMemo, useState } from 'react'
import { lifeSpan, fullName } from '@/domain/dates'
import { useI18n } from '@/shared/i18n/i18n'
import type { PersonPickerProps } from '@/interfaces/components/PersonPickerProps'

const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

export default function PersonPicker({ persons, exclude = [], placeholder, onPick }: PersonPickerProps) {
  const { t, lang } = useI18n()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const matches = useMemo(() => {
    const q = norm(query.trim())
    if (!q) return []
    const skip = new Set(exclude)
    return persons
      .filter((p) => !skip.has(p.id) && norm(`${p.firstName} ${p.lastName} ${p.lastName} ${p.firstName}`).includes(q))
      .slice(0, 8)
  }, [persons, query, exclude])

  return (
    <div className="picker">
      <TextInput value={query} placeholder={placeholder ?? t('picker.placeholder')} onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} />
      {open && query.trim() && (
        <ul className="picker-list">
          {matches.length === 0 && <li className="muted">{t('picker.none')}</li>}
          {matches.map((p) => (
            <li key={p.id}>
              <Button variant="default"
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(p)
                  setQuery('')
                  setOpen(false)
                }}
              >
                {fullName(p)} <span className="muted">{lifeSpan(p, lang)}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
