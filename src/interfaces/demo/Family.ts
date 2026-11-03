import type { LinkType } from '@/interfaces/api/LinkType'
import type { TreeLinks } from '@/interfaces/api/TreeLinks'

export interface Family {
  id: string
  husband: number | null
  wife: number | null
  couple: TreeLinks['couples'][number] | null
  children: number[]
  types: Map<number, LinkType>
}
