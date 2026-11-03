import type { LinkType } from '@/interfaces/api/LinkType'

export interface RelateTo {
  personId: number
  kind: 'PARENT' | 'CHILD' | 'SPOUSE'
  linkType?: LinkType
}
