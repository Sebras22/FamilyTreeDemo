import { describe, expect, it } from 'vitest'
import { FRANCE_DEPARTMENTS } from './franceDepartments'
import { locatePlace } from './places'

const code = (place: string | null | undefined) => locatePlace(place, FRANCE_DEPARTMENTS)

describe('locatePlace', () => {
  it('trouve le département cité après la ville', () => {
    expect(code('Mâcon, Saône-et-Loire, France')).toBe('71')
    expect(code("Dijon, Côte-d'Or, France")).toBe('21')
  })

  it('privilégie le département écrit sur la ville homonyme', () => {
    expect(code('Vienne, Isère, France')).toBe('38')
  })

  it('retombe sur la table des villes quand le département manque', () => {
    expect(code('Lyon')).toBe('69')
    expect(code('Paris, France')).toBe('75')
    expect(code('Saint-Étienne')).toBe('42')
  })

  it('accepte un nom de département seul', () => {
    expect(code('Isère')).toBe('38')
  })

  it('ignore la casse, les accents et les variantes de saint', () => {
    expect(code('SAINT ETIENNE, loire')).toBe('42')
    expect(code('st-etienne')).toBe('42')
  })

  it('ne localise pas les lieux hors de France métropolitaine', () => {
    expect(code('Montréal, Québec, Canada')).toBeNull()
    expect(code('Alger, Algérie')).toBeNull()
  })

  it('renvoie null pour une valeur vide', () => {
    expect(code(null)).toBeNull()
    expect(code(undefined)).toBeNull()
    expect(code('   ')).toBeNull()
  })
})

describe('FRANCE_DEPARTMENTS', () => {
  it('couvre les 96 départements métropolitains avec un tracé', () => {
    expect(FRANCE_DEPARTMENTS).toHaveLength(96)
    expect(FRANCE_DEPARTMENTS.every((d) => d.d.startsWith('M'))).toBe(true)
  })
})
