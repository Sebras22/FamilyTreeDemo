import type { LinkType } from '@/interfaces/api/LinkType'
import type { RelationType } from '@/interfaces/api/RelationType'
import type { ParsedCouple } from '@/interfaces/demo/ParsedCouple'
import type { PersonData } from '@/interfaces/demo/PersonData'

export interface ParsedGedcom {
  persons: { xref: string; data: PersonData }[]
  couples: ParsedCouple[]
  parentLinks: { parent: string; child: string; type: LinkType }[]
  relations: { person: string; related: string; type: RelationType; note: string | null }[]
}
