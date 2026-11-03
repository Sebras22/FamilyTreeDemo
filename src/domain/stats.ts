import { warningTone } from './consistency'
import type { Graph } from '@/interfaces/domain/Graph'
import type { Person } from '@/interfaces/api/Person'
import type { RankedItem } from '@/interfaces/domain/RankedItem'
import type { TreeStats } from '@/interfaces/domain/TreeStats'
import type { Warning } from '@/interfaces/domain/Warning'

const normalize = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

export function topValues(values: (string | null | undefined)[], n: number): RankedItem[] {
  const counts = new Map<string, { count: number; forms: Map<string, number> }>()
  for (const raw of values) {
    const label = raw?.trim()
    if (!label || label === '?') continue
    const key = normalize(label)
    const entry = counts.get(key) ?? { count: 0, forms: new Map() }
    entry.count++
    entry.forms.set(label, (entry.forms.get(label) ?? 0) + 1)
    counts.set(key, entry)
  }
  return [...counts.values()]
    .map((e) => ({ label: [...e.forms.entries()].sort((a, b) => b[1] - a[1])[0][0], count: e.count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, n)
}

export function countGenerations(graph: Graph): number {
  const memo = new Map<number, number>()
  const visiting = new Set<number>()
  const depth = (id: number): number => {
    const known = memo.get(id)
    if (known != null) return known
    if (visiting.has(id)) return 1
    visiting.add(id)
    let best = 1
    for (const l of graph.parentsOf.get(id) ?? []) best = Math.max(best, 1 + depth(l.parentId))
    visiting.delete(id)
    memo.set(id, best)
    return best
  }
  let max = 0
  for (const id of graph.persons.keys()) max = Math.max(max, depth(id))
  return max
}

export function computeTreeStats(graph: Graph, warnings: Map<number, Warning[]>, now: Date): TreeStats {
  const persons = [...graph.persons.values()]
  const countSex = (sex: Person['sex']) => persons.filter((p) => p.sex === sex).length

  const decades = new Map<number, number>()
  for (const p of persons) {
    const year = p.birth?.year
    if (year == null) continue
    const decade = Math.floor(year / 10) * 10
    decades.set(decade, (decades.get(decade) ?? 0) + 1)
  }

  const lifespans = persons
    .filter((p) => !p.living && p.birth?.year != null && p.death?.year != null && p.death.year >= p.birth.year)
    .map((person) => ({ person, age: person.death!.year! - person.birth!.year! }))
  const oldest = [...lifespans].sort((a, b) => b.age - a.age)[0] ?? null

  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const birthdays = persons
    .filter((p) => p.living && p.birth?.month === month && p.birth?.day != null)
    .sort((a, b) => a.birth!.day! - b.birth!.day!)
    .map((person) => ({ person, day: person.birth!.day!, age: person.birth!.year != null ? year - person.birth!.year : null }))

  return {
    persons,
    living: persons.filter((p) => p.living).length,
    sex: { MALE: countSex('MALE'), FEMALE: countSex('FEMALE'), UNKNOWN: countSex('UNKNOWN') },
    decadeBars: [...decades.entries()].sort((a, b) => a[0] - b[0]),
    oldest,
    birthdays,
    surnames: topValues(persons.map((p) => p.lastName), 5),
    places: topValues(persons.map((p) => p.birthPlace), 5),
    birthPlaces: persons.map((p) => p.birthPlace),
    generations: countGenerations(graph),
    couples: graph.links.couples.length,
    missingBirth: persons.filter((p) => p.birth?.year == null).length,
    missingPhoto: persons.filter((p) => !p.hasPhoto).length,
    isolated: persons.filter((p) => !graph.parentsOf.has(p.id) && !graph.childrenOf.has(p.id) && !graph.couplesOf.has(p.id)).length,
    floating: persons.filter((p) => p.floating).length,
    withWarnings: [...warnings.keys()].filter((id) => graph.persons.has(id) && warningTone(warnings.get(id)) != null).length,
  }
}
