import { describe, expect, it } from 'vitest'
import { date, makePerson } from '@/test/factories'
import { formatDate, fullName, hasDate, lifeSpan, parsePartialDate } from './dates'

describe('parsePartialDate', () => {
  it('lit une année seule', () => {
    expect(parsePartialDate('1850')).toEqual({ value: date(1850), invalid: false })
  })

  it('lit une date complète avec un mois en lettres', () => {
    expect(parsePartialDate('12 mars 1850').value).toEqual(date(1850, 3, 12))
    expect(parsePartialDate('March 3rd 1850').value).toEqual(date(1850, 3, 3))
  })

  it('lit les formats numériques', () => {
    expect(parsePartialDate('12/03/1850').value).toEqual(date(1850, 3, 12))
    expect(parsePartialDate('1850-03-12').value).toEqual(date(1850, 3, 12))
    expect(parsePartialDate('03/1850').value).toEqual(date(1850, 3))
  })

  it('reconnaît les préfixes approximatifs', () => {
    expect(parsePartialDate('vers 1850').value).toEqual(date(1850, null, null, true))
    expect(parsePartialDate('~1850').value?.approximate).toBe(true)
    expect(parsePartialDate('abt 1850').value?.approximate).toBe(true)
  })

  it('ignore les accents et la casse', () => {
    expect(parsePartialDate('3 FÉVRIER 1900').value).toEqual(date(1900, 2, 3))
    expect(parsePartialDate('1er août 1914').value).toEqual(date(1914, 8, 1))
  })

  it('renvoie une valeur vide, sans erreur, pour un texte vide', () => {
    expect(parsePartialDate('   ')).toEqual({ value: null, invalid: false })
  })

  it('rejette les dates impossibles', () => {
    expect(parsePartialDate('31/02/1900').invalid).toBe(true)
    expect(parsePartialDate('15/13/1900').invalid).toBe(true)
    expect(parsePartialDate('texte quelconque').invalid).toBe(true)
  })

  it('accepte le 29 février des années bissextiles uniquement', () => {
    expect(parsePartialDate('29/02/1904').invalid).toBe(false)
    expect(parsePartialDate('29/02/1900').invalid).toBe(true)
  })
})

describe('formatDate', () => {
  it('formate selon la langue', () => {
    expect(formatDate(date(1850, 3, 12), 'en')).toMatch(/^12 .+ 1850$/)
    expect(formatDate(date(1850), 'fr')).toBe('1850')
  })

  it('préfixe les dates approximatives', () => {
    expect(formatDate(date(1850, null, null, true), 'fr')).toBe('vers 1850')
    expect(formatDate(date(1850, null, null, true), 'en')).toBe('c. 1850')
  })

  it('renvoie une chaîne vide sans date', () => {
    expect(formatDate(null, 'fr')).toBe('')
    expect(formatDate(date(null), 'fr')).toBe('')
  })

  it("n'affiche pas le jour sans mois", () => {
    expect(formatDate(date(1850, null, 12), 'fr')).toBe('1850')
  })
})

describe('hasDate', () => {
  it('détecte une date partielle', () => {
    expect(hasDate(date(null, 5))).toBe(true)
    expect(hasDate(date(null))).toBe(false)
    expect(hasDate(undefined)).toBe(false)
  })
})

describe('lifeSpan', () => {
  it('affiche naissance et décès', () => {
    expect(lifeSpan(makePerson(1, { birth: date(1842), death: date(1911) }), 'fr')).toBe('1842 – 1911')
  })

  it('marque les années approximatives et inconnues', () => {
    expect(lifeSpan(makePerson(1, { birth: date(1846, null, null, true), death: null }), 'fr')).toBe('~1846 – ?')
    expect(lifeSpan(makePerson(1, { birth: null, death: date(1923) }), 'fr')).toBe('? – 1923')
  })

  it('affiche seulement la naissance pour une personne vivante', () => {
    expect(lifeSpan(makePerson(1, { birth: date(1990), living: true }), 'fr')).toBe('né(e) en 1990')
    expect(lifeSpan(makePerson(1, { birth: date(1990), living: true }), 'en')).toBe('b. 1990')
  })

  it('renvoie une chaîne vide sans aucune année', () => {
    expect(lifeSpan(makePerson(1), 'fr')).toBe('')
  })
})

describe('fullName', () => {
  it('assemble prénom et nom sans espace superflu', () => {
    expect(fullName({ firstName: 'Jean', lastName: 'Dupont' })).toBe('Jean Dupont')
    expect(fullName({ firstName: '', lastName: 'Dupont' })).toBe('Dupont')
  })
})
