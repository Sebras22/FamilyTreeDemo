import type { Sex } from '@/interfaces/api/Sex'

export interface SexChoiceProps {
  value: Sex | ''
  onChange: (sex: Sex) => void
}
