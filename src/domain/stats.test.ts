import { describe, expect, it } from 'vitest'
import { couple, date, makeGraph, makePerson, parentLink } from '@/test/factories'
import { computeTreeStats, countGenerations, topValues } from './stats'

describe('topValues', () => {
  it('compte sans tenir compte de la casse ni des accents', () => {
    const result = topValues(['Lyon', 'lyon', 'LYON', 'Paris', 'Mâcon', 'Macon'], 5)
    expect(result).toEqual([
      { label: 'Lyon', count: 3 },
      { label: 'Mâcon', count: 2 },
      { label: 'Paris', count: 1 },
    ])
  })

  it('ignore les valeurs vides et le point d interrogation', () => {
    expect(topValues([null, undefined, '', '  ', '?', 'Nice'], 5)).toEqual([{ label: 'Nice', count: 1 }])
  })

  it('limite le nombre de résultats', () => {
    expect(topValues(['a', 'b', 'c', 'd'], 2)).toHaveLength(2)
  })

  it('conserve la graphie la plus fréquente', () => {
    expect(topValues(['Saint-Étienne', 'Saint-Étienne', 'saint-etienne'], 1)[0]).toEqual({ label: 'Saint-Étienne', count: 3 })
  })
})

describe('countGenerations', () => {
  it('compte la profondeur maximale de la lignée', () => {
    const persons = [1, 2, 3, 4].map((id) => makePerson(id))
    const g = makeGraph(persons, [parentLink(1, 1, 2), parentLink(2, 2, 3)])
    expect(countGenerations(g)).toBe(3)
  })

  it('renvoie 0 pour un arbre vide et 1 pour une personne seule', () => {
    expect(countGenerations(makeGraph([]))).toBe(0)
    expect(countGenerations(makeGraph([makePerson(1)]))).toBe(1)
  })

  it('termine sur un cycle', () => {
    const g = makeGraph([makePerson(1), makePerson(2)], [parentLink(1, 1, 2), parentLink(2, 2, 1)])
    expect(countGenerations(g)).toBeGreaterThan(0)
  })
})

describe('computeTreeStats', () => {
  const now = new Date(2026, 5, 15)
  const persons = [
    makePerson(1, { sex: 'MALE', lastName: 'Martin', birth: date(1900), death: date(1990), birthPlace: 'Lyon' }),
    makePerson(2, { sex: 'FEMALE', lastName: 'Martin', birth: date(1905), death: date(1960), birthPlace: 'Lyon', hasPhoto: true }),
    makePerson(3, { sex: 'FEMALE', lastName: 'Durand', birth: date(1930, 6, 20), living: true, birthPlace: 'Paris' }),
    makePerson(4, { sex: 'UNKNOWN', lastName: 'Seul', floating: true }),
  ]
  const graph = makeGraph(persons, [parentLink(1, 1, 3), parentLink(2, 2, 3)], [couple(1, 1, 2)])
  const stats = computeTreeStats(graph, new Map(), now)

  it('compte les personnes, les vivants et les sexes', () => {
    expect(stats.persons).toHaveLength(4)
    expect(stats.living).toBe(1)
    expect(stats.sex).toEqual({ MALE: 1, FEMALE: 2, UNKNOWN: 1 })
  })

  it('regroupe les naissances par décennie triée', () => {
    expect(stats.decadeBars).toEqual([
      [1900, 2],
      [1930, 1],
    ])
  })

  it('trouve le doyen parmi les personnes décédées', () => {
    expect(stats.oldest?.person.id).toBe(1)
    expect(stats.oldest?.age).toBe(90)
  })

  it('liste les anniversaires du mois courant des personnes vivantes', () => {
    expect(stats.birthdays).toEqual([{ person: persons[2], day: 20, age: 96 }])
  })

  it('classe noms et lieux', () => {
    expect(stats.surnames[0]).toEqual({ label: 'Martin', count: 2 })
    expect(stats.places[0]).toEqual({ label: 'Lyon', count: 2 })
  })

  it('compte les manques et anomalies de structure', () => {
    expect(stats.missingBirth).toBe(1)
    expect(stats.missingPhoto).toBe(3)
    expect(stats.isolated).toBe(1)
    expect(stats.floating).toBe(1)
    expect(stats.couples).toBe(1)
    expect(stats.generations).toBe(2)
  })

  it('compte les personnes avec un avertissement non confirmé', () => {
    const warning = { code: 'DEATH_BEFORE_BIRTH', personId: 1, severity: 'error', confirmed: false } as never
    expect(computeTreeStats(graph, new Map([[1, [warning]], [99, [warning]]]), now).withWarnings).toBe(1)
  })
})
