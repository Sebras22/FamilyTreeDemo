import type { CoupleType } from '@/interfaces/api/CoupleType'
import type { EndReason } from '@/interfaces/api/EndReason'
import type { PDate } from '@/interfaces/api/PDate'

export interface Couple {
  id: number
  person1Id: number
  person2Id: number
  type: CoupleType
  start: PDate | null
  startPlace: string | null
  end: PDate | null
  endReason: EndReason | null
}
