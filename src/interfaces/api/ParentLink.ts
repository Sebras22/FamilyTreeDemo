import type { LinkType } from '@/interfaces/api/LinkType'

export interface ParentLink {
  id: number
  parentId: number
  childId: number
  linkType: LinkType
}
