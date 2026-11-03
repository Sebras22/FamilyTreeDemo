import type { CoupleType } from '@/interfaces/api/CoupleType'
import type { EndReason } from '@/interfaces/api/EndReason'
import type { PDate } from '@/interfaces/api/PDate'

export interface ParsedCouple {
  xref1: string
  xref2: string
  type: CoupleType
  start: PDate | null
  startPlace: string | null
  end: PDate | null
  endReason: EndReason | null
}
