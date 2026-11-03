import { fullName } from './dates'
import type { Couple } from '@/interfaces/api/Couple'
import type { Graph } from '@/interfaces/domain/Graph'
import type { ParentLink } from '@/interfaces/api/ParentLink'
import type { Person } from '@/interfaces/api/Person'
import type { Relation } from '@/interfaces/api/Relation'
import type { TreeLinks } from '@/interfaces/api/TreeLinks'

function push<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const list = map.get(key)
  if (list) list.push(value)
  else map.set(key, [value])
}

export function buildGraph(persons: Person[], links: TreeLinks): Graph {
  const byId = new Map(persons.map((p) => [p.id, p]))
  const parentsOf = new Map<number, ParentLink[]>()
  const childrenOf = new Map<number, ParentLink[]>()
  const couplesOf = new Map<number, Couple[]>()
  const relationsOf = new Map<number, Relation[]>()
  for (const l of links.parentChild) {
    if (!byId.has(l.parentId) || !byId.has(l.childId)) continue
    push(parentsOf, l.childId, l)
    push(childrenOf, l.parentId, l)
  }
  for (const c of links.couples) {
    if (!byId.has(c.person1Id) || !byId.has(c.person2Id)) continue
    push(couplesOf, c.person1Id, c)
    push(couplesOf, c.person2Id, c)
  }
  for (const r of links.relations) {
    if (!byId.has(r.personId) || !byId.has(r.relatedId)) continue
    push(relationsOf, r.personId, r)
    push(relationsOf, r.relatedId, r)
  }
  return { persons: byId, parentsOf, childrenOf, couplesOf, relationsOf, links }
}

export const nameOf = (g: Graph, id: number) => {
  const p = g.persons.get(id)
  return p ? fullName(p) : '?'
}

export const partnerOf = (c: Couple, id: number) => (c.person1Id === id ? c.person2Id : c.person1Id)

function collectRelatives(index: Map<number, ParentLink[]>, next: (l: ParentLink) => number, id: number, maxDepth: number): Map<number, number> {
  const out = new Map<number, number>()
  let frontier = [id]
  for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth++) {
    const following: number[] = []
    for (const current of frontier) {
      const links = index.get(current)
      if (!links) continue
      for (const l of links) {
        const target = next(l)
        if (target !== id && !out.has(target)) {
          out.set(target, depth)
          following.push(target)
        }
      }
    }
    frontier = following
  }
  return out
}

export const ancestors = (g: Graph, id: number, maxDepth = Infinity) => collectRelatives(g.parentsOf, (l) => l.parentId, id, maxDepth)

export const descendants = (g: Graph, id: number, maxDepth = Infinity) => collectRelatives(g.childrenOf, (l) => l.childId, id, maxDepth)
