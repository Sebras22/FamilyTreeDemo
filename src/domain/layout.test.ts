import { describe, expect, it } from 'vitest'
import { couple, date, makePerson, parentLink } from '@/test/factories'
import { CARD_H, CARD_W, computeLayout } from './layout'

describe('computeLayout', () => {
  it('renvoie une mise en page vide sans personne', () => {
    const layout = computeLayout([], [], [])
    expect(layout.positions.size).toBe(0)
    expect(layout.scale).toBeNull()
  })

  it('positionne chaque personne', () => {
    const persons = [1, 2, 3].map((id) => makePerson(id, { birth: date(1900 + id * 25) }))
    const layout = computeLayout(persons, [parentLink(1, 1, 2), parentLink(2, 2, 3)], [])
    expect([...layout.positions.keys()].sort()).toEqual([1, 2, 3])
  })

  it('place les enfants sous leurs parents', () => {
    const persons = [makePerson(1, { birth: date(1900) }), makePerson(2, { birth: date(1930) }), makePerson(3, { birth: date(1960) })]
    const { positions } = computeLayout(persons, [parentLink(1, 1, 2), parentLink(2, 2, 3)], [])
    expect(positions.get(1)!.y).toBeLessThan(positions.get(2)!.y)
    expect(positions.get(2)!.y).toBeLessThan(positions.get(3)!.y)
  })

  it('aligne les conjoints sur la même ligne, sans chevauchement', () => {
    const persons = [makePerson(1, { birth: date(1900) }), makePerson(2, { birth: date(1902) })]
    const { positions } = computeLayout(persons, [], [couple(1, 1, 2)])
    const a = positions.get(1)!
    const b = positions.get(2)!
    expect(a.y).toBe(b.y)
    expect(Math.abs(a.x - b.x)).toBeGreaterThanOrEqual(CARD_W)
  })

  it('évite le chevauchement de deux cartes', () => {
    const persons = [1, 2, 3, 4, 5, 6].map((id) => makePerson(id, { birth: date(1900) }))
    const list = [...computeLayout(persons, [], []).positions.values()]
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const apart = Math.abs(list[i].x - list[j].x) >= CARD_W || Math.abs(list[i].y - list[j].y) >= CARD_H
        expect(apart).toBe(true)
      }
    }
  })

  it('marque comme estimées les personnes sans date', () => {
    const persons = [makePerson(1, { birth: date(1900) }), makePerson(2)]
    const layout = computeLayout(persons, [parentLink(1, 1, 2)], [])
    expect(layout.estimated.has(2)).toBe(true)
    expect(layout.estimated.has(1)).toBe(false)
  })

  it('ignore les liens vers des personnes absentes de la sélection', () => {
    const layout = computeLayout([makePerson(1, { birth: date(1900) })], [parentLink(1, 1, 99)], [couple(1, 1, 99)])
    expect([...layout.positions.keys()]).toEqual([1])
  })

  it('est déterministe', () => {
    const persons = [1, 2, 3, 4].map((id) => makePerson(id, { birth: date(1900 + id * 10) }))
    const links = [parentLink(1, 1, 3), parentLink(2, 2, 3), parentLink(3, 2, 4)]
    const unions = [couple(1, 1, 2)]
    const first = computeLayout(persons, links, unions)
    const second = computeLayout(persons, links, unions)
    expect([...second.positions]).toEqual([...first.positions])
  })
})
