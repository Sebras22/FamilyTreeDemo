import type { BirthKind } from '@/interfaces/api/BirthKind'
import type { PDate } from '@/interfaces/api/PDate'
import type { Reliability } from '@/interfaces/api/Reliability'
import type { Sex } from '@/interfaces/api/Sex'

export interface Person {
  id: number
  treeId: number
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
  living: boolean
  birthKind: BirthKind
  twinGroup: string | null
  occupation: string | null
  biography: string | null
  source: string | null
  sourceReliability: Reliability | null
  hasPhoto: boolean
  floating: boolean
  deletedAt: string | null
}
