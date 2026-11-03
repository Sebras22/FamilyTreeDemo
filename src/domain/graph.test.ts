import { describe, expect, it } from 'vitest'
import { couple, makeGraph, makePerson, parentLink } from '@/test/factories'
import { ancestors, buildGraph, descendants, partnerOf } from './graph'

const persons = [1, 2, 3, 4, 5].map((id) => makePerson(id))

describe('buildGraph', () => {
  it('indexe les liens parents-enfants dans les deux sens', () => {
    const g = makeGraph(persons, [parentLink(1, 1, 3), parentLink(2, 2, 3)])
    expect(g.parentsOf.get(3)?.map((l) => l.parentId)).toEqual([1, 2])
    expect(g.childrenOf.get(1)?.map((l) => l.childId)).toEqual([3])
  })

  it('ignore les liens vers des personnes absentes', () => {
    const g = makeGraph(persons, [parentLink(1, 1, 99)], [couple(1, 1, 99)])
    expect(g.childrenOf.size).toBe(0)
    expect(g.couplesOf.size).toBe(0)
  })

  it('indexe les couples pour les deux partenaires', () => {
    const g = makeGraph(persons, [], [couple(1, 1, 2)])
    expect(g.couplesOf.get(1)).toHaveLength(1)
    expect(g.couplesOf.get(2)).toHaveLength(1)
  })

  it('conserve les liens bruts', () => {
    const links = { parentChild: [], couples: [], relations: [] }
    expect(buildGraph(persons, links).links).toBe(links)
  })
})

describe('partnerOf', () => {
  it("renvoie l'autre membre du couple", () => {
    const c = couple(1, 1, 2)
    expect(partnerOf(c, 1)).toBe(2)
    expect(partnerOf(c, 2)).toBe(1)
  })
})

describe('ancestors et descendants', () => {
  const g = makeGraph(persons, [parentLink(1, 1, 2), parentLink(2, 2, 3), parentLink(3, 3, 4)])

  it('calcule la profondeur de chaque ancêtre', () => {
    expect([...ancestors(g, 4)]).toEqual([
      [3, 1],
      [2, 2],
      [1, 3],
    ])
  })

  it('calcule la profondeur de chaque descendant', () => {
    expect([...descendants(g, 1)]).toEqual([
      [2, 1],
      [3, 2],
      [4, 3],
    ])
  })

  it('respecte la profondeur maximale', () => {
    expect([...ancestors(g, 4, 2).keys()]).toEqual([3, 2])
  })

  it('renvoie un résultat vide pour une personne isolée', () => {
    expect(ancestors(g, 5).size).toBe(0)
    expect(descendants(g, 5).size).toBe(0)
  })

  it('ne boucle pas sur un cycle', () => {
    const cyclic = makeGraph(persons, [parentLink(1, 1, 2), parentLink(2, 2, 1)])
    expect([...ancestors(cyclic, 1).keys()]).toEqual([2])
  })
})
