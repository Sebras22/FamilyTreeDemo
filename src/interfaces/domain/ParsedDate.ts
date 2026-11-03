import type { PDate } from '@/interfaces/api/PDate'

export interface ParsedDate {
  value: PDate | null
  invalid: boolean
}
