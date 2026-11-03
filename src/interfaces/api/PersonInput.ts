import type { BirthKind } from '@/interfaces/api/BirthKind'
import type { PDate } from '@/interfaces/api/PDate'
import type { RelateTo } from '@/interfaces/api/RelateTo'
import type { Reliability } from '@/interfaces/api/Reliability'
import type { Sex } from '@/interfaces/api/Sex'

export interface PersonInput {
  firstName: string
  middleNames: string | null
  lastName: string
  birthName: string | null
  nickname: string | null
  sex: Sex
  birth: PDate | null
  birthPlace: string | null
  death: PDate | null
  deathPlace: string | null
  deceased: boolean
  birthKind: BirthKind
  twinGroup: string | null
  occupation: string | null
  biography: string | null
  source: string | null
  sourceReliability: Reliability | null
  relateTo?: RelateTo
}
