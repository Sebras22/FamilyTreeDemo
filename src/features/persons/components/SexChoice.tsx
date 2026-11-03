import { Input, SegmentedControl } from '@mantine/core'
import { useI18n } from '@/shared/i18n/i18n'
import type { Sex } from '@/interfaces/api/Sex'
import type { SexChoiceProps } from '@/interfaces/components/SexChoiceProps'

const SEXES: Sex[] = ['MALE', 'FEMALE', 'UNKNOWN']

export default function SexChoice({ value, onChange }: SexChoiceProps) {
  const { t } = useI18n()
  return (
    <Input.Wrapper label={`${t('form.sex')} *`}>
      <SegmentedControl
        fullWidth
        value={value}
        onChange={(v) => onChange(v as Sex)}
        aria-label={t('form.sex')}
        data={SEXES.map((s) => ({ value: s, label: t(`sex.${s}`) }))}
      />
    </Input.Wrapper>
  )
}
