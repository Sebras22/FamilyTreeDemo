import type { Couple } from '@/interfaces/api/Couple'
import type { ParentLink } from '@/interfaces/api/ParentLink'
import type { Relation } from '@/interfaces/api/Relation'

export interface TreeLinks {
  parentChild: ParentLink[]
  couples: Couple[]
  relations: Relation[]
}
