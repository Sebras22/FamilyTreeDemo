import { describe, expect, it } from 'vitest'
import { couple, makeGraph, makePerson, parentLink } from '@/test/factories'
import { computeVisibleIds } from './visibility'

const persons = [1, 2, 3, 4, 5, 6, 7].map((id) => makePerson(id))
const graph = makeGraph(
  persons,
  [parentLink(1, 1, 3), parentLink(2, 2, 3), parentLink(3, 3, 4), parentLink(4, 4, 5), parentLink(5, 6, 7)],
  [couple(1, 1, 2), couple(2, 4, 6)],
)

const sorted = (ids: Set<number>) => [...ids].sort((a, b) => a - b)

describe('computeVisibleIds', () => {
  it('affiche tout le monde en vue complète', () => {
    expect(sorted(computeVisibleIds(graph, 'all', null, 3, new Set()))).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('limite la vue centrée aux ancêtres et descendants dans la profondeur demandée, avec les conjoints', () => {
    expect(sorted(computeVisibleIds(graph, 'focus', 3, 1, new Set()))).toEqual([1, 2, 3, 4, 6])
  })

  it('inclut le conjoint d une personne visible', () => {
    expect(sorted(computeVisibleIds(graph, 'focus', 4, 1, new Set()))).toContain(6)
  })

  it('traite une profondeur de 0 comme illimitée', () => {
    expect(sorted(computeVisibleIds(graph, 'focus', 5, 0, new Set()))).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('retombe sur la vue complète quand la personne centrale est inconnue', () => {
    expect(computeVisibleIds(graph, 'focus', 99, 2, new Set()).size).toBe(7)
    expect(computeVisibleIds(graph, 'focus', null, 2, new Set()).size).toBe(7)
  })

  it('masque la descendance d une personne repliée, son conjoint sans parents, mais pas elle-même', () => {
    const visible = computeVisibleIds(graph, 'all', null, 3, new Set([3]))
    expect(sorted(visible)).toEqual([1, 2, 3, 7])
  })

  it('conserve le conjoint de la personne repliée et ses enfants', () => {
    const visible = computeVisibleIds(graph, 'all', null, 3, new Set([4]))
    expect(visible.has(5)).toBe(false)
    expect(visible.has(6)).toBe(true)
    expect(visible.has(7)).toBe(true)
  })

  it('ignore un repli dont la personne n est pas visible', () => {
    expect(computeVisibleIds(graph, 'focus', 3, 1, new Set([7])).size).toBe(5)
  })
})
