import { TextInput } from '@mantine/core'
import { useEffect, useRef, useState } from 'react'
import { formatDate, parsePartialDate } from '@/domain/dates'
import { useI18n } from '@/shared/i18n/i18n'
import type { PDate } from '@/interfaces/api/PDate'
import type { PartialDateInputProps } from '@/interfaces/components/PartialDateInputProps'

export default function PartialDateInput({ label, value, onChange, onInvalid }: PartialDateInputProps) {
  const { t, lang } = useI18n()
  const [text, setText] = useState(() => formatDate(value, lang))
  const lastEmitted = useRef<PDate | null>(value)

  useEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(lastEmitted.current)) {
      lastEmitted.current = value
      setText(formatDate(value, lang))
    }
  }, [value, lang])

  const parsed = parsePartialDate(text)

  const update = (next: string) => {
    setText(next)
    const result = parsePartialDate(next)
    onInvalid?.(result.invalid)
    lastEmitted.current = result.value
    onChange(result.value)
  }

  return (
    <TextInput
      label={label}
      value={text}
      onChange={(e) => update(e.target.value)}
      placeholder={t('date.placeholder')}
      inputMode="text"
      autoComplete="off"
      error={parsed.invalid ? t('date.invalid') : undefined}
      description={parsed.invalid ? undefined : parsed.value ? `→ ${formatDate(parsed.value, lang)}` : t('date.hint')}
      inputWrapperOrder={['label', 'input', 'description', 'error']}
    />
  )
}
