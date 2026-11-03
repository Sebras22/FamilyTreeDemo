import { describe, expect, it } from 'vitest'
import { couple, makeGraph, makePerson, parentLink } from '@/test/factories'
import { kinship, kinshipLabel } from './kinship'
import type { Kinship } from '@/interfaces/domain/Kinship'

const persons = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((id) => makePerson(id))
const family = makeGraph(
  persons,
  [parentLink(1, 1, 3), parentLink(2, 1, 4), parentLink(3, 1, 5), parentLink(4, 3, 6), parentLink(5, 4, 7), parentLink(6, 5, 8)],
  [couple(1, 3, 9)],
)

const kin = (kind: Kinship['kind'], extra: Partial<Kinship> = {}): Kinship => ({ kind, generations: 0, degree: 0, removal: 0, byMarriage: false, ...extra })

describe('kinship', () => {
  it('reconnaît la même personne', () => {
    expect(kinship(family, 3, 3)?.kind).toBe('SELF')
  })

  it('reconnaît un ascendant avec son nombre de générations', () => {
    expect(kinship(family, 6, 1)).toMatchObject({ kind: 'ANCESTOR', generations: 2 })
  })

  it('reconnaît un descendant', () => {
    expect(kinship(family, 1, 6)).toMatchObject({ kind: 'DESCENDANT', generations: 2 })
  })

  it('reconnaît frère ou sœur', () => {
    expect(kinship(family, 3, 4)?.kind).toBe('SIBLING')
  })

  it('reconnaît oncle et neveu dans les deux sens', () => {
    expect(kinship(family, 6, 4)).toMatchObject({ kind: 'UNCLE', generations: 1 })
    expect(kinship(family, 4, 6)).toMatchObject({ kind: 'NEPHEW', generations: 1 })
  })

  it('reconnaît des cousins germains', () => {
    expect(kinship(family, 6, 7)).toMatchObject({ kind: 'COUSIN', degree: 1, removal: 0 })
  })

  it('reconnaît le conjoint', () => {
    expect(kinship(family, 3, 9)?.kind).toBe('SPOUSE')
  })

  it('marque la parenté par alliance', () => {
    expect(kinship(family, 9, 6)).toMatchObject({ kind: 'DESCENDANT', byMarriage: true })
  })

  it('renvoie null pour deux personnes sans lien', () => {
    expect(kinship(makeGraph([makePerson(1), makePerson(2)]), 1, 2)).toBeNull()
  })
})

describe('kinshipLabel', () => {
  it('accorde le libellé au sexe', () => {
    expect(kinshipLabel(kin('ANCESTOR', { generations: 1 }), 'FEMALE', 'fr')).toBe('mère')
    expect(kinshipLabel(kin('ANCESTOR', { generations: 1 }), 'MALE', 'en')).toBe('father')
  })

  it('ajoute arrière- pour les générations lointaines', () => {
    expect(kinshipLabel(kin('ANCESTOR', { generations: 3 }), 'MALE', 'fr')).toMatch(/arrière/)
  })

  it('indique la parenté par alliance', () => {
    expect(kinshipLabel(kin('SIBLING', { byMarriage: true }), 'MALE', 'fr')).toMatch(/par alliance$/)
    expect(kinshipLabel(kin('SIBLING', { byMarriage: true }), 'MALE', 'en')).toMatch(/by marriage$/)
  })

  it('décrit les cousins germains', () => {
    expect(kinshipLabel(kin('COUSIN', { degree: 1 }), 'FEMALE', 'fr')).toBe('cousine germaine')
    expect(kinshipLabel(kin('COUSIN', { degree: 1 }), 'MALE', 'en')).toBe('first cousin')
  })
})
