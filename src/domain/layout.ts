import dagre from '@dagrejs/dagre'
import { birthYear, deathYear } from './dates'
import type { Couple } from '@/interfaces/api/Couple'
import type { LayoutResult } from '@/interfaces/domain/LayoutResult'
import type { ParentLink } from '@/interfaces/api/ParentLink'
import type { Person } from '@/interfaces/api/Person'
import type { Position } from '@/interfaces/domain/Position'

export const CARD_W = 184
export const CARD_H = 84
const COUPLE_GAP = 44
const PX_PER_YEAR = 8
const GENERATION = 28
const V_GAP = 44

function estimateYears(
  persons: Person[],
  parentLinks: ParentLink[],
  couples: Couple[],
): { years: Map<number, number>; estimated: Set<number>; known: boolean } {
  const years = new Map<number, number>()
  for (const p of persons) {
    const y = birthYear(p) ?? (deathYear(p) != null ? deathYear(p)! - 70 : null)
    if (y != null) years.set(p.id, y)
  }
  const known = years.size > 0
  const estimated = new Set<number>()
  const parents = new Map<number, number[]>()
  const children = new Map<number, number[]>()
  const partners = new Map<number, number[]>()
  const add = (m: Map<number, number[]>, k: number, v: number) => m.set(k, [...(m.get(k) ?? []), v])
  for (const l of parentLinks) {
    add(parents, l.childId, l.parentId)
    add(children, l.parentId, l.childId)
  }
  for (const c of couples) {
    add(partners, c.person1Id, c.person2Id)
    add(partners, c.person2Id, c.person1Id)
  }

  for (let pass = 0; pass < 8; pass++) {
    let changed = false
    for (const p of persons) {
      if (years.has(p.id)) continue
      const fromPartner = (partners.get(p.id) ?? []).map((id) => years.get(id)).filter((y): y is number => y != null)
      const fromParents = (parents.get(p.id) ?? []).map((id) => years.get(id)).filter((y): y is number => y != null)
      const fromChildren = (children.get(p.id) ?? []).map((id) => years.get(id)).filter((y): y is number => y != null)
      let guess: number | null = null
      if (fromPartner.length) guess = Math.round(fromPartner.reduce((a, b) => a + b, 0) / fromPartner.length)
      else if (fromParents.length)
        guess = Math.round(fromParents.reduce((a, b) => a + b, 0) / fromParents.length) + GENERATION
      else if (fromChildren.length) guess = Math.min(...fromChildren) - GENERATION
      if (guess != null) {
        years.set(p.id, guess)
        estimated.add(p.id)
        changed = true
      }
    }
    if (!changed) break
  }

  const missing = persons.filter((p) => !years.has(p.id))
  if (missing.length) {
    const fallback = known ? Math.min(...years.values()) : 1900
    for (const p of missing) {
      years.set(p.id, fallback)
      estimated.add(p.id)
    }
  }
  return { years, estimated, known }
}

class UnionFind {
  private parent = new Map<number, number>()
  find(x: number): number {
    if (!this.parent.has(x)) this.parent.set(x, x)
    let root = x
    while (this.parent.get(root) !== root) root = this.parent.get(root)!
    this.parent.set(x, root)
    return root
  }
  union(a: number, b: number) {
    this.parent.set(this.find(a), this.find(b))
  }
}

function orderCluster(members: Person[], couples: Couple[]): Person[] {
  if (members.length === 1) return members
  const ids = new Set(members.map((m) => m.id))
  const inside = couples.filter((c) => ids.has(c.person1Id) && ids.has(c.person2Id))
  const degree = new Map<number, number>()
  for (const c of inside) {
    degree.set(c.person1Id, (degree.get(c.person1Id) ?? 0) + 1)
    degree.set(c.person2Id, (degree.get(c.person2Id) ?? 0) + 1)
  }
  const sorted = [...members].sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0) || a.id - b.id)
  if (members.length === 2) {
    const [a, b] = sorted
    return a.sex === 'FEMALE' && b.sex !== 'FEMALE' ? [b, a] : a.sex === b.sex ? [...sorted].sort((x, y) => x.id - y.id) : [a, b]
  }
  const adjacency = new Map<number, Set<number>>()
  for (const c of inside) {
    adjacency.set(c.person1Id, (adjacency.get(c.person1Id) ?? new Set()).add(c.person2Id))
    adjacency.set(c.person2Id, (adjacency.get(c.person2Id) ?? new Set()).add(c.person1Id))
  }
  const ends = members.filter((m) => (adjacency.get(m.id)?.size ?? 0) === 1)
  if (ends.length === 2 && members.every((m) => (adjacency.get(m.id)?.size ?? 0) <= 2)) {
    const byId = new Map(members.map((m) => [m.id, m]))
    const path: Person[] = []
    const seen = new Set<number>()
    let current: number | undefined = ends.sort((a, b) => a.id - b.id)[0].id
    while (current !== undefined && !seen.has(current)) {
      seen.add(current)
      path.push(byId.get(current)!)
      current = [...(adjacency.get(current) ?? [])].find((n) => !seen.has(n))
    }
    if (path.length === members.length) return path
  }
  const hub = sorted[0]
  const startYear = (id: number) =>
    inside
      .filter((c) => c.person1Id === hub.id || c.person2Id === hub.id)
      .find((c) => c.person1Id === id || c.person2Id === id)?.start?.year ?? 9999
  const others = sorted.slice(1).sort((a, b) => startYear(a.id) - startYear(b.id) || a.id - b.id)
  const left: Person[] = []
  const right: Person[] = []
  others.forEach((o, i) => (i % 2 === 0 ? right : left).push(o))
  return [...left.reverse(), hub, ...right]
}

export function computeLayout(persons: Person[], parentLinks: ParentLink[], couples: Couple[]): LayoutResult {
  if (persons.length === 0) return { positions: new Map(), estimated: new Set(), scale: null }
  const ids = new Set(persons.map((p) => p.id))
  const links = parentLinks.filter((l) => ids.has(l.parentId) && ids.has(l.childId))
  const unions = couples.filter((c) => ids.has(c.person1Id) && ids.has(c.person2Id))

  const { years, estimated, known } = estimateYears(persons, links, unions)

  const uf = new UnionFind()
  for (const p of persons) uf.find(p.id)
  for (const c of unions) uf.union(c.person1Id, c.person2Id)
  const clusters = new Map<number, Person[]>()
  for (const p of persons) {
    const root = uf.find(p.id)
    clusters.set(root, [...(clusters.get(root) ?? []), p])
  }
  const ordered = new Map<number, Person[]>()
  for (const [root, members] of clusters) ordered.set(root, orderCluster(members, unions))

  const memberIndex = new Map<number, number>()
  for (const members of ordered.values()) members.forEach((m, i) => memberIndex.set(m.id, i))
  const clusterYear = (root: number) => Math.min(...(ordered.get(root) ?? []).map((m) => years.get(m.id) ?? 9999))
  const edges = new Map<string, { from: number; to: number; union: number }>()
  for (const l of links) {
    const from = uf.find(l.parentId)
    const to = uf.find(l.childId)
    if (from === to) continue
    const key = `${from}>${to}`
    const union = memberIndex.get(l.parentId) ?? 0
    const known = edges.get(key)
    if (known) known.union = Math.min(known.union, union)
    else edges.set(key, { from, to, union })
  }
  const edgeList = [...edges.values()].sort((a, b) => a.union - b.union || clusterYear(a.to) - clusterYear(b.to) || a.to - b.to)

  const byParent = new Map<number, { to: number; union: number }[]>()
  for (const e of edgeList) byParent.set(e.from, [...(byParent.get(e.from) ?? []), { to: e.to, union: e.union }])
  const build = (reversed: Set<number>) => {
    const g = new dagre.graphlib.Graph()
    g.setGraph({ rankdir: 'TB', nodesep: 76, ranksep: 150, marginx: 0, marginy: 0 })
    g.setDefaultEdgeLabel(() => ({}))
    for (const [root, members] of ordered) {
      g.setNode(`c${root}`, { width: members.length * CARD_W + (members.length - 1) * COUPLE_GAP, height: CARD_H })
    }
    for (const [from, list] of byParent) {
      for (const child of reversed.has(from) ? [...list].reverse() : list) g.setEdge(`c${from}`, `c${child.to}`)
    }
    dagre.layout(g)
    return g
  }

  const multiUnion = [...byParent.entries()].filter(([, list]) => new Set(list.map((c) => c.union)).size > 1)
  const score = (g: ReturnType<typeof build>) => {
    let inversions = 0
    for (const [, list] of multiUnion) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const [p, q] = list[i].union <= list[j].union ? [list[i], list[j]] : [list[j], list[i]]
          if (p.union < q.union && g.node(`c${p.to}`).x > g.node(`c${q.to}`).x) inversions++
        }
      }
    }
    let length = 0
    for (const e of edgeList) length += Math.abs(g.node(`c${e.from}`).x - g.node(`c${e.to}`).x)
    return inversions * 1e6 + length
  }

  const reversed = new Set<number>()
  let graph = build(reversed)
  let best = score(graph)
  if (multiUnion.length > 0 && best >= 1e6 && ordered.size <= 400) {
    const attempts = [new Set(multiUnion.map(([from]) => from)), reversed]
    for (const start of attempts) {
      if (start === reversed) continue
      const g = build(start)
      const value = score(g)
      if (value < best) {
        graph = g
        best = value
        start.forEach((f) => reversed.add(f))
      }
    }
    for (const [from] of multiUnion.slice(0, 12)) {
      if (best < 1e6) break
      const trial = new Set(reversed)
      if (trial.has(from)) trial.delete(from)
      else trial.add(from)
      const g = build(trial)
      const value = score(g)
      if (value < best) {
        graph = g
        best = value
        reversed.clear()
        trial.forEach((f) => reversed.add(f))
      }
    }
  }

  const parentsOf = new Map<number, number[]>()
  for (const l of links) parentsOf.set(l.childId, [...(parentsOf.get(l.childId) ?? []), l.parentId])
  for (const [root, members] of ordered) {
    if (members.length !== 2) continue
    const center = graph.node(`c${root}`).x
    const side = (m: Person): number => {
      const xs = (parentsOf.get(m.id) ?? [])
        .map((parent) => uf.find(parent))
        .filter((r) => r !== root)
        .map((r) => graph.node(`c${r}`).x)
      return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : center
    }
    const [a, b] = members
    const sa = side(a)
    const sb = side(b)
    if (sa !== sb) ordered.set(root, sa < sb ? [a, b] : [b, a])
  }

  const values = [...years.values()]
  const minYear = Math.min(...values)
  const maxYear = Math.max(...values)
  const yearToY = (year: number) => (year - minYear) * PX_PER_YEAR

  const positions = new Map<number, Position>()
  const rows: Position[][] = []
  for (const [root, members] of ordered) {
    const node = graph.node(`c${root}`)
    const left = node.x - node.width / 2
    const ys = members.map((m) => years.get(m.id)!)
    const aligned = Math.max(...ys) - Math.min(...ys) <= 15
    const rowYear = Math.min(...ys)
    const placed = members.map((m, i) => {
      const pos = { x: left + i * (CARD_W + COUPLE_GAP), y: yearToY(aligned ? rowYear : years.get(m.id)!) }
      positions.set(m.id, pos)
      return pos
    })
    if (aligned) rows.push(placed)
    else placed.forEach((pos) => rows.push([pos]))
  }

  const cell = CARD_W + COUPLE_GAP
  const grid = new Map<number, Position[]>()
  const byY = [...rows].sort((a, b) => a[0].y - b[0].y || a[0].x - b[0].x)
  for (const row of byY) {
    let y = row[0].y
    let moved = true
    while (moved) {
      moved = false
      for (const pos of row) {
        const b0 = Math.floor(pos.x / cell) - 1
        const b1 = Math.floor((pos.x + CARD_W) / cell) + 1
        for (let b = b0; b <= b1; b++) {
          for (const q of grid.get(b) ?? []) {
            const overlapsX = pos.x < q.x + CARD_W && q.x < pos.x + CARD_W
            if (overlapsX && y < q.y + CARD_H + V_GAP) {
              y = q.y + CARD_H + V_GAP
              moved = true
            }
          }
        }
      }
    }
    for (const pos of row) {
      pos.y = y
      const home = Math.floor(pos.x / cell)
      grid.set(home, [...(grid.get(home) ?? []), pos])
    }
  }

  return { positions, estimated, scale: known ? { minYear, maxYear, yearToY } : null }
}
