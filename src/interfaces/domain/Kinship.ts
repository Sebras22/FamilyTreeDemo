import type { KinshipKind } from '@/interfaces/domain/KinshipKind'

export interface Kinship {
  kind: KinshipKind
  generations: number
  degree: number
  removal: number
  byMarriage: boolean
}
