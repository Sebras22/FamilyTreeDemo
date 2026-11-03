import type { PDate } from '@/interfaces/api/PDate'

export interface PartialDateInputProps {
  label: string
  value: PDate | null
  onChange: (value: PDate | null) => void
  onInvalid?: (invalid: boolean) => void
}
