import { describe, expect, it } from 'vitest'
import { couple, date, makeGraph, makePerson, parentLink } from '@/test/factories'
import { findWarnings, warningKey, warningTone } from './consistency'
import type { Warning } from '@/interfaces/domain/Warning'

const codesFor = (map: ReturnType<typeof findWarnings>, id: number) => (map.get(id) ?? []).map((w) => w.code)

describe('findWarnings', () => {
  it('ne signale rien sur un arbre cohérent', () => {
    const g = makeGraph(
      [makePerson(1, { birth: date(1900), death: date(1970) }), makePerson(2, { birth: date(1930) })],
      [parentLink(1, 1, 2)],
    )
    expect(findWarnings(g).size).toBe(0)
  })

  it('détecte un décès avant la naissance', () => {
    const g = makeGraph([makePerson(1, { birth: date(1900), death: date(1890) })])
    expect(codesFor(findWarnings(g), 1)).toEqual(['DEATH_BEFORE_BIRTH'])
  })

  it('traite une vie trop longue comme un doute et non comme une erreur', () => {
    const g = makeGraph([makePerson(1, { birth: date(1800), death: date(1930) })])
    const [warning] = findWarnings(g).get(1)!
    expect(warning.code).toBe('VERY_OLD')
    expect(warning.severity).toBe('doubt')
  })

  it('détecte un parent plus jeune que son enfant', () => {
    const g = makeGraph([makePerson(1, { birth: date(1950) }), makePerson(2, { birth: date(1940) })], [parentLink(1, 1, 2)])
    const found = findWarnings(g)
    expect(codesFor(found, 1)).toContain('PARENT_YOUNGER_THAN_CHILD')
    expect(codesFor(found, 2)).toContain('PARENT_YOUNGER_THAN_CHILD')
  })

  it('détecte un parent biologique trop jeune mais pas un parent adoptif', () => {
    const persons = [makePerson(1, { birth: date(1900) }), makePerson(2, { birth: date(1908) })]
    expect(codesFor(findWarnings(makeGraph(persons, [parentLink(1, 1, 2)])), 1)).toContain('PARENT_TOO_YOUNG')
    expect(findWarnings(makeGraph(persons, [parentLink(1, 1, 2, 'ADOPTIVE')])).size).toBe(0)
  })

  it('détecte une mère trop âgée', () => {
    const g = makeGraph([makePerson(1, { sex: 'FEMALE', birth: date(1900) }), makePerson(2, { birth: date(1960) })], [parentLink(1, 1, 2)])
    expect(codesFor(findWarnings(g), 1)).toContain('MOTHER_TOO_OLD')
  })

  it("tolère une naissance un an après le décès du père mais pas de la mère", () => {
    const child = makePerson(3, { birth: date(1921) })
    const father = makeGraph([makePerson(1, { sex: 'MALE', birth: date(1880), death: date(1920) }), child], [parentLink(1, 1, 3)])
    const mother = makeGraph([makePerson(1, { sex: 'FEMALE', birth: date(1880), death: date(1920) }), child], [parentLink(1, 1, 3)])
    expect(findWarnings(father).size).toBe(0)
    expect(codesFor(findWarnings(mother), 3)).toContain('PARENT_DEAD_BEFORE_BIRTH')
  })

  it('détecte une union terminée avant son début', () => {
    const g = makeGraph([makePerson(1), makePerson(2)], [], [couple(1, 1, 2, { start: date(1930), end: date(1920) })])
    expect(codesFor(findWarnings(g), 1)).toContain('UNION_END_BEFORE_START')
  })

  it('détecte une union après un décès', () => {
    const g = makeGraph([makePerson(1, { death: date(1920) }), makePerson(2)], [], [couple(1, 1, 2, { start: date(1930) })])
    expect(codesFor(findWarnings(g), 1)).toContain('UNION_AFTER_DEATH')
  })

  it('détecte une union trop précoce', () => {
    const g = makeGraph([makePerson(1, { birth: date(1920) }), makePerson(2)], [], [couple(1, 1, 2, { start: date(1930) })])
    expect(codesFor(findWarnings(g), 1)).toContain('UNION_TOO_YOUNG')
  })

  it("détecte un cycle d'ascendance une seule fois par personne", () => {
    const g = makeGraph([makePerson(1), makePerson(2), makePerson(3)], [parentLink(1, 1, 2), parentLink(2, 2, 3), parentLink(3, 3, 1)])
    const found = findWarnings(g)
    for (const id of [1, 2, 3]) expect(codesFor(found, id).filter((c) => c === 'ANCESTOR_CYCLE')).toHaveLength(1)
  })
})

describe('warningTone', () => {
  const warn = (severity: Warning['severity'], confirmed = false): Warning => ({ code: 'X', personId: 1, severity, confirmed }) as Warning

  it("privilégie l'erreur sur le doute", () => {
    expect(warningTone([warn('doubt'), warn('error')])).toBe('error')
  })

  it('ignore les avertissements confirmés', () => {
    expect(warningTone([warn('error', true)])).toBeNull()
    expect(warningTone([warn('doubt', true), warn('doubt')])).toBe('doubt')
  })

  it('renvoie null sans avertissement', () => {
    expect(warningTone(undefined)).toBeNull()
    expect(warningTone([])).toBeNull()
  })
})

describe('warningKey', () => {
  it('distingue les avertissements par leurs paramètres', () => {
    const a = { code: 'VERY_OLD', personId: 1, params: { age: 130 }, severity: 'doubt', confirmed: false } as Warning
    const b = { ...a, params: { age: 131 } } as Warning
    expect(warningKey(a)).not.toBe(warningKey(b))
    expect(warningKey(a)).toBe(warningKey({ ...a }))
  })
})
