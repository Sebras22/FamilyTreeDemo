import { birthYear, deathYear } from './dates'
import type { Graph } from '@/interfaces/domain/Graph'
import type { RawWarning } from '@/interfaces/domain/RawWarning'
import type { Warning } from '@/interfaces/domain/Warning'

const DOUBT_CODES = new Set(['VERY_OLD', 'PARENT_TOO_YOUNG', 'MOTHER_TOO_OLD', 'UNION_TOO_YOUNG'])

export const warningKey = (w: Warning) => `${w.code}|${w.personId}|${w.otherId ?? ''}|${Object.values(w.params ?? {}).join(',')}`

export function warningTone(ws: Warning[] | undefined): 'error' | 'doubt' | null {
  let tone: 'error' | 'doubt' | null = null
  for (const w of ws ?? []) {
    if (w.confirmed) continue
    if (w.severity === 'error') return 'error'
    tone = 'doubt'
  }
  return tone
}

const MIN_PARENT_AGE = 12
const MAX_MOTHER_AGE = 55
const MAX_LIFESPAN = 120

export function findWarnings(g: Graph): Map<number, Warning[]> {
  const out = new Map<number, Warning[]>()
  const add = (raw: RawWarning) => {
    const w: Warning = { ...raw, severity: DOUBT_CODES.has(raw.code) ? 'doubt' : 'error' }
    const list = out.get(w.personId)
    if (list) list.push(w)
    else out.set(w.personId, [w])
  }

  for (const p of g.persons.values()) {
    const b = birthYear(p)
    const d = deathYear(p)
    if (b != null && d != null) {
      if (d < b) add({ code: 'DEATH_BEFORE_BIRTH', personId: p.id })
      else if (d - b > MAX_LIFESPAN) add({ code: 'VERY_OLD', personId: p.id, params: { age: d - b } })
    }
  }

  for (const l of g.links.parentChild) {
    const parent = g.persons.get(l.parentId)
    const child = g.persons.get(l.childId)
    if (!parent || !child) continue
    const pb = birthYear(parent)
    const cb = birthYear(child)
    const pd = deathYear(parent)
    if (pb != null && cb != null) {
      const age = cb - pb
      if (age < 0) {
        add({ code: 'PARENT_YOUNGER_THAN_CHILD', personId: child.id, otherId: parent.id })
        add({ code: 'PARENT_YOUNGER_THAN_CHILD', personId: parent.id, otherId: child.id })
      } else if (age < MIN_PARENT_AGE && l.linkType === 'BIOLOGICAL') {
        add({ code: 'PARENT_TOO_YOUNG', personId: child.id, otherId: parent.id, params: { age } })
        add({ code: 'PARENT_TOO_YOUNG', personId: parent.id, otherId: child.id, params: { age } })
      } else if (age > MAX_MOTHER_AGE && parent.sex === 'FEMALE' && l.linkType === 'BIOLOGICAL') {
        add({ code: 'MOTHER_TOO_OLD', personId: parent.id, otherId: child.id, params: { age } })
      }
    }
    if (pd != null && cb != null && child.birthKind === 'LIVE') {
      const limit = parent.sex === 'MALE' ? pd + 1 : pd
      if (cb > limit) add({ code: 'PARENT_DEAD_BEFORE_BIRTH', personId: child.id, otherId: parent.id })
    }
  }

  for (const c of g.links.couples) {
    const a = g.persons.get(c.person1Id)
    const b = g.persons.get(c.person2Id)
    if (!a || !b) continue
    const start = c.start?.year ?? null
    const end = c.end?.year ?? null
    if (start != null && end != null && end < start) {
      add({ code: 'UNION_END_BEFORE_START', personId: a.id, otherId: b.id })
      add({ code: 'UNION_END_BEFORE_START', personId: b.id, otherId: a.id })
    }
    for (const [x, y] of [[a, b], [b, a]] as const) {
      const xb = birthYear(x)
      if (start != null && xb != null && start - xb < MIN_PARENT_AGE) {
        add({ code: 'UNION_TOO_YOUNG', personId: x.id, otherId: y.id })
      }
      const xd = deathYear(x)
      if (start != null && xd != null && start > xd) {
        add({ code: 'UNION_AFTER_DEATH', personId: x.id, otherId: y.id })
      }
    }
  }

  const state = new Map<number, 0 | 1 | 2>()
  const reported = new Set<number>()
  const visit = (start: number) => {
    const stack: { id: number; i: number }[] = [{ id: start, i: 0 }]
    state.set(start, 1)
    while (stack.length) {
      const top = stack[stack.length - 1]
      const parents = g.parentsOf.get(top.id) ?? []
      if (top.i >= parents.length) {
        state.set(top.id, 2)
        stack.pop()
        continue
      }
      const next = parents[top.i++].parentId
      const s = state.get(next) ?? 0
      if (s === 1) {
        for (const frame of stack.slice(stack.findIndex((f) => f.id === next))) {
          if (!reported.has(frame.id)) {
            reported.add(frame.id)
            add({ code: 'ANCESTOR_CYCLE', personId: frame.id })
          }
        }
      } else if (s === 0) {
        state.set(next, 1)
        stack.push({ id: next, i: 0 })
      }
    }
  }
  for (const id of g.persons.keys()) if (!state.has(id)) visit(id)

  return out
}
