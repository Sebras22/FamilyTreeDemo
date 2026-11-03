import { buildGraph } from '@/domain/graph'
import type { Couple } from '@/interfaces/api/Couple'
import type { Graph } from '@/interfaces/domain/Graph'
import type { PDate } from '@/interfaces/api/PDate'
import type { ParentLink } from '@/interfaces/api/ParentLink'
import type { Person } from '@/interfaces/api/Person'

export const date = (year: number | null, month: number | null = null, day: number | null = null, approximate = false): PDate => ({
  year,
  month,
  day,
  approximate,
})

export function makePerson(id: number, overrides: Partial<Person> = {}): Person {
  return {
    id,
    treeId: 1,
    firstName: `P${id}`,
    middleNames: null,
    lastName: 'Test',
    birthName: null,
    nickname: null,
    sex: 'UNKNOWN',
    birth: null,
    birthPlace: null,
    death: null,
    deathPlace: null,
    deceased: false,
    living: false,
    birthKind: 'LIVE',
    twinGroup: null,
    occupation: null,
    biography: null,
    source: null,
    sourceReliability: null,
    hasPhoto: false,
    floating: false,
    deletedAt: null,
    ...overrides,
  }
}

export const parentLink = (id: number, parentId: number, childId: number, linkType: ParentLink['linkType'] = 'BIOLOGICAL'): ParentLink => ({
  id,
  parentId,
  childId,
  linkType,
})

export const couple = (id: number, person1Id: number, person2Id: number, overrides: Partial<Couple> = {}): Couple => ({
  id,
  person1Id,
  person2Id,
  type: 'MARRIAGE',
  start: null,
  startPlace: null,
  end: null,
  endReason: null,
  ...overrides,
})

export function makeGraph(persons: Person[], parentChild: ParentLink[] = [], couples: Couple[] = []): Graph {
  return buildGraph(persons, { parentChild, couples, relations: [] })
}
