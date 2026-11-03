import { ancestors, partnerOf } from './graph'
import type { Ancestry } from '@/interfaces/domain/Ancestry'
import type { Forms } from '@/interfaces/domain/Forms'
import type { Graph } from '@/interfaces/domain/Graph'
import type { Kinship } from '@/interfaces/domain/Kinship'
import type { KinshipKind } from '@/interfaces/domain/KinshipKind'
import type { Lang } from '@/interfaces/i18n/Lang'
import type { Sex } from '@/interfaces/api/Sex'

const rel = (kind: KinshipKind, extra: Partial<Kinship> = {}): Kinship => ({ kind, generations: 0, degree: 0, removal: 0, byMarriage: false, ...extra })

function blood(focus: number, other: number, up: Ancestry): Kinship | null {
  if (focus === other) return rel('SELF')
  const focusUp = up(focus)
  const otherUp = up(other)
  const above = focusUp.get(other)
  if (above != null) return rel('ANCESTOR', { generations: above })
  const below = otherUp.get(focus)
  if (below != null) return rel('DESCENDANT', { generations: below })

  const [small, large, swapped] = focusUp.size <= otherUp.size ? [focusUp, otherUp, false] : [otherUp, focusUp, true]
  let best: { da: number; db: number } | null = null
  for (const [ancestor, ds] of small) {
    const dl = large.get(ancestor)
    if (dl != null && (!best || ds + dl < best.da + best.db)) best = swapped ? { da: dl, db: ds } : { da: ds, db: dl }
  }
  if (!best) return null
  const { da, db } = best
  if (da === 1 && db === 1) return rel('SIBLING')
  if (da === 1) return rel('NEPHEW', { generations: db - 1 })
  if (db === 1) return rel('UNCLE', { generations: da - 1 })
  return rel('COUSIN', { degree: Math.min(da, db) - 1, removal: Math.abs(da - db) })
}

export function kinship(g: Graph, focus: number, other: number): Kinship | null {
  const cache = new Map<number, Map<number, number>>()
  const up: Ancestry = (id) => {
    let found = cache.get(id)
    if (!found) cache.set(id, (found = ancestors(g, id)))
    return found
  }

  const direct = blood(focus, other, up)
  if (direct) return direct

  const focusCouples = g.couplesOf.get(focus) ?? []
  if (focusCouples.some((c) => partnerOf(c, focus) === other)) return rel('SPOUSE')

  const byMarriage = (k: Kinship | null) => (k && k.kind !== 'SELF' ? { ...k, byMarriage: true } : null)
  for (const c of focusCouples) {
    const viaSpouse = byMarriage(blood(partnerOf(c, focus), other, up))
    if (viaSpouse) return viaSpouse
  }
  for (const c of g.couplesOf.get(other) ?? []) {
    const viaSpouse = byMarriage(blood(focus, partnerOf(c, other), up))
    if (viaSpouse) return viaSpouse
  }
  return null
}

const pick = (sex: Sex, male: string, female: string, neutral: string) =>
  sex === 'MALE' ? male : sex === 'FEMALE' ? female : neutral

function great(n: number, lang: Lang, word: string): string {
  if (n <= 0) return word
  if (lang === 'fr') return `${n === 1 ? 'arrière-' : `arrière(×${n})-`}${word}`
  return `${n === 1 ? 'great-' : `great(×${n})-`}${word}`
}

function ordinal(n: number, lang: Lang): string {
  if (lang === 'fr') return n === 1 ? '1er' : `${n}e`
  const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'
  return `${n}${suffix}`
}

const WORDS: Record<Lang, Record<string, Forms>> = {
  fr: {
    spouse: ['époux', 'épouse', 'conjoint(e)'],
    parent: ['père', 'mère', 'parent'],
    grandparent: ['grand-père', 'grand-mère', 'grand-parent'],
    child: ['fils', 'fille', 'enfant'],
    grandchild: ['petit-fils', 'petite-fille', 'petit-enfant'],
    sibling: ['frère', 'sœur', 'frère ou sœur'],
    uncle: ['oncle', 'tante', 'oncle ou tante'],
    greatUncle: ['grand-oncle', 'grand-tante', 'grand-oncle'],
    nephew: ['neveu', 'nièce', 'neveu ou nièce'],
    grandNephew: ['petit-neveu', 'petite-nièce', 'petit-neveu'],
    cousin: ['cousin', 'cousine', 'cousin(e)'],
  },
  en: {
    spouse: ['husband', 'wife', 'spouse'],
    parent: ['father', 'mother', 'parent'],
    grandparent: ['grandfather', 'grandmother', 'grandparent'],
    child: ['son', 'daughter', 'child'],
    grandchild: ['grandson', 'granddaughter', 'grandchild'],
    sibling: ['brother', 'sister', 'sibling'],
    uncle: ['uncle', 'aunt', 'uncle/aunt'],
    greatUncle: ['great-uncle', 'great-aunt', 'great-uncle'],
    nephew: ['nephew', 'niece', 'nephew/niece'],
    grandNephew: ['grand-nephew', 'grand-niece', 'grand-nephew'],
    cousin: ['cousin', 'cousin', 'cousin'],
  },
}

export function kinshipLabel(k: Kinship, sex: Sex, lang: Lang): string {
  const fr = lang === 'fr'
  const word = (key: string) => pick(sex, ...WORDS[lang][key])
  let label: string
  switch (k.kind) {
    case 'SELF':
      return fr ? 'Personne centrale' : 'Focus person'
    case 'SPOUSE':
      return word('spouse')
    case 'ANCESTOR':
      label = k.generations === 1 ? word('parent') : great(k.generations - 2, lang, word('grandparent'))
      break
    case 'DESCENDANT':
      label = k.generations === 1 ? word('child') : great(k.generations - 2, lang, word('grandchild'))
      break
    case 'SIBLING':
      label = word('sibling')
      break
    case 'UNCLE':
      label = k.generations === 1 ? word('uncle') : great(k.generations - 2, lang, word('greatUncle'))
      break
    case 'NEPHEW':
      label = k.generations === 1 ? word('nephew') : great(k.generations - 2, lang, word('grandNephew'))
      break
    case 'COUSIN': {
      const noun = word('cousin')
      if (k.degree === 1) label = fr ? `${noun} germain${sex === 'FEMALE' ? 'e' : ''}` : `first ${noun}`
      else label = fr ? `${noun} au ${ordinal(k.degree, lang)} degré` : `${ordinal(k.degree, lang)} ${noun}`
      if (k.removal > 0) label += fr ? ` (décalage de ${k.removal} génération${k.removal > 1 ? 's' : ''})` : `, ${k.removal} generation${k.removal > 1 ? 's' : ''} removed`
      break
    }
  }
  return k.byMarriage ? `${label} ${fr ? 'par alliance' : 'by marriage'}` : label
}
