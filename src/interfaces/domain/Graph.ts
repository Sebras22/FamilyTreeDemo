import type { Couple } from '@/interfaces/api/Couple'
import type { ParentLink } from '@/interfaces/api/ParentLink'
import type { Person } from '@/interfaces/api/Person'
import type { Relation } from '@/interfaces/api/Relation'
import type { TreeLinks } from '@/interfaces/api/TreeLinks'

export interface Graph {
  persons: Map<number, Person>
  parentsOf: Map<number, ParentLink[]>
  childrenOf: Map<number, ParentLink[]>
  couplesOf: Map<number, Couple[]>
  relationsOf: Map<number, Relation[]>
  links: TreeLinks
}
