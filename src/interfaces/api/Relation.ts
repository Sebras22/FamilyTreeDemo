import type { RelationType } from '@/interfaces/api/RelationType'

export interface Relation {
  id: number
  personId: number
  relatedId: number
  type: RelationType
  note: string | null
}
