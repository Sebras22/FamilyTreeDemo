import { describe, expect, it } from 'vitest'
import { ApiError } from '../apiError'
import sample from './famille-delacroix.ged?raw'
import { assertGedcomSize, exportGedcom, importGedcom } from './gedcom'
import type { DemoState } from '@/interfaces/demo/DemoState'

const emptyState = (): DemoState => ({ trees: [], persons: [], parentLinks: [], couples: [], relations: [], comments: [], history: [], nextId: 1 })
const encode = (text: string) => new TextEncoder().encode(text)
const linksOf = (state: DemoState) => ({ parentChild: state.parentLinks, couples: state.couples, relations: state.relations })

const MINI = [
  '0 HEAD',
  '1 CHAR UTF-8',
  '0 @I1@ INDI',
  '1 NAME Jean /Dupont/',
  '1 SEX M',
  '1 BIRT',
  '2 DATE 12 MAR 1850',
  '2 PLAC Lyon, Rhône, France',
  '1 DEAT',
  '2 DATE ABT 1920',
  '0 @I2@ INDI',
  '1 NAME Marie /Martin/',
  '1 SEX F',
  '0 @I3@ INDI',
  '1 NAME Paul /Dupont/',
  '1 SEX M',
  '1 BIRT',
  '2 DATE 1880',
  '0 @F1@ FAM',
  '1 HUSB @I1@',
  '1 WIFE @I2@',
  '1 CHIL @I3@',
  '1 MARR',
  '2 DATE 1875',
  '2 PLAC Paris, France',
  '0 TRLR',
].join('\n')

describe('importGedcom', () => {
  it('importe personnes, couples et liens parent-enfant', () => {
    const state = emptyState()
    const result = importGedcom(state, encode(MINI), 'Test')
    expect(result).toMatchObject({ persons: 3, couples: 1, parentLinks: 2 })
    expect(state.trees).toHaveLength(1)
    expect(state.trees[0].name).toBe('Test')
  })

  it('lit nom, sexe, dates et lieux', () => {
    const state = emptyState()
    importGedcom(state, encode(MINI), 'Test')
    const jean = state.persons.find((p) => p.firstName === 'Jean')!
    expect(jean.lastName).toBe('Dupont')
    expect(jean.sex).toBe('MALE')
    expect(jean.birth).toEqual({ year: 1850, month: 3, day: 12, approximate: false })
    expect(jean.birthPlace).toBe('Lyon, Rhône, France')
    expect(jean.death).toMatchObject({ year: 1920, approximate: true })
  })

  it('lit la date et le lieu du mariage', () => {
    const state = emptyState()
    importGedcom(state, encode(MINI), 'Test')
    expect(state.couples[0]).toMatchObject({ type: 'MARRIAGE', startPlace: 'Paris, France' })
    expect(state.couples[0].start?.year).toBe(1875)
  })

  it('relie les enfants aux deux parents de la famille', () => {
    const state = emptyState()
    importGedcom(state, encode(MINI), 'Test')
    const paul = state.persons.find((p) => p.firstName === 'Paul')!
    expect(state.parentLinks.filter((l) => l.childId === paul.id)).toHaveLength(2)
  })

  it('attribue des identifiants uniques à tous les objets', () => {
    const state = emptyState()
    importGedcom(state, encode(MINI), 'Test')
    const all = [...state.trees.map((t) => t.id), ...state.persons.map((p) => p.id), ...state.couples.map((c) => c.id), ...state.parentLinks.map((l) => l.id)]
    expect(new Set(all).size).toBe(all.length)
  })

  it('accepte un BOM UTF-8', () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...encode(MINI)])
    expect(importGedcom(emptyState(), bytes, 'Test').persons).toBe(3)
  })

  it('accepte les fins de ligne Windows', () => {
    expect(importGedcom(emptyState(), encode(MINI.replace(/\n/g, '\r\n')), 'Test').persons).toBe(3)
  })

  it("rejette un fichier qui n'est pas du GEDCOM", () => {
    expect(() => importGedcom(emptyState(), encode('ceci est un texte quelconque'), 'Test')).toThrow(ApiError)
  })

  it("importe l'arbre d'exemple en entier", () => {
    const result = importGedcom(emptyState(), encode(sample), 'Exemple')
    expect(result.persons).toBe(54)
  })
})

describe('garde-fous', () => {
  it('refuse un fichier trop volumineux avant de le lire', () => {
    expect(() => assertGedcomSize(21 * 1024 * 1024)).toThrow(/trop volumineux/)
    expect(() => assertGedcomSize(1024)).not.toThrow()
  })

  it('refuse un fichier avec trop d individus', () => {
    const lines = ['0 HEAD']
    for (let i = 0; i < 20001; i++) lines.push(`0 @I${i}@ INDI`, '1 NAME A /B/')
    expect(() => importGedcom(emptyState(), encode(lines.join('\n')), 'Gros')).toThrow(/individus maximum/)
  })

  it('ignore les niveaux d imbrication absurdes', () => {
    const deep = [MINI.replace('0 TRLR', ''), '99 NOTE ignoré', '0 TRLR'].join('\n')
    expect(importGedcom(emptyState(), encode(deep), 'Test').persons).toBe(3)
  })
})

describe('exportGedcom', () => {
  it('produit un fichier GEDCOM structuré', () => {
    const state = emptyState()
    importGedcom(state, encode(MINI), 'Test')
    const text = exportGedcom(state.persons, linksOf(state))
    expect(text.startsWith('0 HEAD')).toBe(true)
    expect(text.trimEnd().endsWith('0 TRLR')).toBe(true)
    expect(text).toContain('1 NAME Jean /Dupont/')
    expect(text).toContain('2 PLAC Lyon, Rhône, France')
  })

  it("conserve les données lors d'un aller-retour import, export, import", () => {
    const first = emptyState()
    importGedcom(first, encode(sample), 'Exemple')
    const exported = exportGedcom(first.persons, linksOf(first))

    const second = emptyState()
    const result = importGedcom(second, encode(exported), 'Copie')

    expect(result.persons).toBe(first.persons.length)
    expect(result.couples).toBe(first.couples.length)
    expect(result.parentLinks).toBe(first.parentLinks.length)
    const summary = (state: DemoState) =>
      state.persons.map((p) => `${p.firstName}|${p.lastName}|${p.sex}|${p.birth?.year ?? ''}|${p.death?.year ?? ''}|${p.birthPlace ?? ''}`).sort()
    expect(summary(second)).toEqual(summary(first))
  })
})
