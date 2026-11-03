import { ApiError } from '../apiError'
import type { BirthKind } from '@/interfaces/api/BirthKind'
import type { DemoState } from '@/interfaces/demo/DemoState'
import type { Family } from '@/interfaces/demo/Family'
import type { ImportResult } from '@/interfaces/demo/ImportResult'
import type { LinkType } from '@/interfaces/api/LinkType'
import type { PDate } from '@/interfaces/api/PDate'
import type { ParsedCouple } from '@/interfaces/demo/ParsedCouple'
import type { ParsedGedcom } from '@/interfaces/demo/ParsedGedcom'
import type { PersonData } from '@/interfaces/demo/PersonData'
import type { PersonRecord } from '@/interfaces/demo/PersonRecord'
import type { RelationType } from '@/interfaces/api/RelationType'
import type { Reliability } from '@/interfaces/api/Reliability'
import type { TreeLinks } from '@/interfaces/api/TreeLinks'

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const LINE = /^\s*(\d+)\s+(?:(@[^@]+@)\s+)?(\S+)(?:\s(.*))?$/
const YEAR = /(\d{3,4})/

const MAX_GEDCOM_BYTES = 20 * 1024 * 1024
const MAX_GEDCOM_PERSONS = 20000
const MAX_LEVEL = 20

export function assertGedcomSize(bytes: number) {
  if (bytes > MAX_GEDCOM_BYTES) {
    throw new ApiError(413, `Fichier GEDCOM trop volumineux (${MAX_GEDCOM_BYTES / 1024 / 1024} Mo maximum)`)
  }
}

class Node {
  readonly children: Node[] = []
  readonly value: string
  constructor(
    readonly level: number,
    readonly xref: string | null,
    readonly tag: string,
    value: string | undefined,
  ) {
    this.value = (value ?? '').trim()
  }
  child(tag: string): Node | null {
    return this.children.find((n) => n.tag === tag) ?? null
  }
  all(tag: string): Node[] {
    return this.children.filter((n) => n.tag === tag)
  }
  text(tag: string): string | null {
    return this.child(tag)?.value ?? null
  }
}

const trimToNull = (value: string | null | undefined) => (value == null || value.trim() === '' ? null : value.trim())
const cut = (value: string | null, max: number) => (value == null || value.length <= max ? value : value.slice(0, max))

function decode(data: Uint8Array): string {
  const bom = data.length >= 3 && data[0] === 0xef && data[1] === 0xbb && data[2] === 0xbf
  const offset = bom ? 3 : 0
  const head = new TextDecoder('iso-8859-1').decode(data.subarray(offset, offset + 2000)).toUpperCase()
  const legacy = !bom && /CHAR (ANSI|ISO|ASCII)/.test(head)
  return new TextDecoder(legacy ? 'windows-1252' : 'utf-8').decode(data.subarray(offset))
}

function parse(content: string): Node[] {
  const roots: Node[] = []
  const stack: Node[] = []
  for (const line of content.split(/\r\n|\r|\n/)) {
    const m = LINE.exec(line)
    if (!m) continue
    const level = Number(m[1])
    if (level > MAX_LEVEL) continue
    const node = new Node(level, m[2] ?? null, m[3].toUpperCase(), m[4])
    while (stack.length > 0 && stack[stack.length - 1].level >= level) stack.pop()
    if (stack.length === 0) roots.push(node)
    else stack[stack.length - 1].children.push(node)
    stack.push(node)
  }
  return roots
}

function parseDate(raw: string | null): PDate | null {
  if (raw == null || raw.trim() === '') return null
  let text = raw.trim().toUpperCase()
  const approximate = /^(ABT|EST|CAL|BEF|AFT|BET|FROM|~)/.test(text)
  text = text.replace(/^(ABT|EST|CAL|BEF|AFT|BET|FROM|~)\.?\s*/, '')
  let day: number | null = null
  let month: number | null = null
  let year: number | null = null
  for (const token of text.split(/[\s,]+/).filter(Boolean)) {
    if (token === 'AND' || token === 'TO') break
    const m = MONTHS.findIndex((name) => token.startsWith(name)) + 1
    if (m > 0 && month == null) {
      month = m
    } else if (/^\d{1,2}$/.test(token) && day == null && year == null && month == null) {
      day = Number(token)
    } else {
      const match = YEAR.exec(token)
      if (match && year == null) year = Number(match[1])
    }
  }
  if (year == null) return null
  if (day != null && (day < 1 || day > 31)) day = null
  if (month == null) day = null
  return { year, month, day, approximate }
}

function surnameOf(name: Node): string | null {
  const surn = trimToNull(name.text('SURN'))
  if (surn != null) return surn
  const open = name.value.indexOf('/')
  const close = open >= 0 ? name.value.indexOf('/', open + 1) : -1
  return open >= 0 && close > open ? trimToNull(name.value.slice(open + 1, close)) : null
}

function relationType(rela: string | null): RelationType {
  const text = (rela ?? '').toLowerCase()
  if (/(godparent|godfather|godmother|parrain|marraine)/.test(text)) return 'GODPARENT'
  if (/(witness|t[ée]moin)/.test(text)) return 'WITNESS'
  if (/(guardian|tuteur|tutrice)/.test(text)) return 'GUARDIAN'
  return 'OTHER'
}

function pedigreeType(pedi: string | null): LinkType {
  switch (pedi?.toLowerCase()) {
    case 'adopted':
      return 'ADOPTIVE'
    case 'foster':
      return 'FOSTER'
    case 'step':
      return 'STEP'
    case 'legal':
      return 'LEGAL'
    default:
      return 'BIOLOGICAL'
  }
}

function joinContinuations(note: Node): string {
  let out = note.value
  for (const n of note.children) {
    if (n.tag === 'CONT') out += '\n' + n.value
    else if (n.tag === 'CONC') out += n.value
  }
  return out
}

function toPerson(indi: Node, sources: Map<string, string>): PersonData {
  const p: PersonData = {
    firstName: '?',
    middleNames: null,
    lastName: '?',
    birthName: null,
    nickname: null,
    sex: 'UNKNOWN',
    birth: null,
    birthPlace: null,
    death: null,
    deathPlace: null,
    deceased: false,
    birthKind: 'LIVE',
    twinGroup: null,
    occupation: null,
    biography: null,
    source: null,
    sourceReliability: null,
  }
  const names = indi.all('NAME')
  const nameNode = names[0] ?? null
  let given: string | null = null
  let surname: string | null = null
  if (nameNode) {
    const name = nameNode.value
    const open = name.indexOf('/')
    const close = open >= 0 ? name.indexOf('/', open + 1) : -1
    if (open >= 0 && close > open) {
      given = name.slice(0, open).trim()
      surname = name.slice(open + 1, close).trim()
    } else {
      given = name.trim()
    }
    if (trimToNull(nameNode.text('GIVN'))) given = nameNode.text('GIVN')
    if (trimToNull(nameNode.text('SURN'))) surname = nameNode.text('SURN')
    p.nickname = cut(trimToNull(nameNode.text('NICK')), 120)
  }
  for (const extra of names.slice(1)) {
    if (extra.text('TYPE')?.toLowerCase() === 'birth') {
      const birthName = surnameOf(extra)
      if (birthName != null) p.birthName = cut(birthName, 120)
    }
  }
  if (p.nickname == null) {
    for (const extra of names.slice(1)) {
      const type = extra.text('TYPE')?.toLowerCase()
      if (type === 'aka' || type === 'nickname') p.nickname = cut(trimToNull(extra.value.replace(/\//g, ' ').trim()), 120)
    }
  }
  const givenParts = given == null ? [] : given.trim().split(/\s+/)
  p.firstName = givenParts.length === 0 || givenParts[0] === '' ? '?' : cut(givenParts[0], 120)!
  if (givenParts.length > 1) p.middleNames = cut(givenParts.slice(1).join(' '), 255)
  p.lastName = surname == null || surname.trim() === '' ? '?' : cut(surname, 120)!

  const sex = indi.text('SEX')?.toUpperCase()
  p.sex = sex === 'M' ? 'MALE' : sex === 'F' ? 'FEMALE' : 'UNKNOWN'

  const birt = indi.child('BIRT')
  if (birt) {
    p.birth = parseDate(birt.text('DATE'))
    p.birthPlace = cut(trimToNull(birt.text('PLAC')), 255)
  }
  const deat = indi.child('DEAT')
  if (deat) {
    p.death = parseDate(deat.text('DATE'))
    p.deathPlace = cut(trimToNull(deat.text('PLAC')), 255)
    p.deceased = true
  }
  if (indi.child('BURI')) p.deceased = true

  const birthKind = trimToNull(indi.text('_BIRTHKIND'))?.toUpperCase()
  if (birthKind === 'STILLBORN' || birthKind === 'MISCARRIAGE') {
    p.birthKind = birthKind as BirthKind
    p.deceased = true
  }
  p.twinGroup = cut(trimToNull(indi.text('_TWIN')), 40)

  const sour = indi.child('SOUR')
  if (sour) {
    const text = sour.value.startsWith('@') ? (sources.get(sour.value) ?? null) : trimToNull(sour.value)
    const page = trimToNull(sour.text('PAGE'))
    if (text != null || page != null) p.source = cut([text, page].filter((x) => x != null).join(' — '), 500)
    const quay = trimToNull(sour.text('QUAY'))
    const reliability: Record<string, Reliability> = { '0': 'LOW', '1': 'LOW', '2': 'MEDIUM', '3': 'HIGH' }
    if (quay != null) p.sourceReliability = reliability[quay] ?? null
  }
  p.occupation = cut(trimToNull(indi.text('OCCU')), 255)
  const note = indi.child('NOTE')
  if (note) p.biography = cut(trimToNull(joinContinuations(note)), 5000)
  return p
}

function parseGedcom(data: Uint8Array): ParsedGedcom {
  assertGedcomSize(data.length)
  const records = parse(decode(data))
  const individuals = records.filter((n) => n.tag === 'INDI').length
  if (individuals === 0) {
    throw new ApiError(400, 'Fichier GEDCOM invalide : aucun individu trouvé')
  }
  if (individuals > MAX_GEDCOM_PERSONS) {
    throw new ApiError(413, `Fichier GEDCOM trop volumineux (${MAX_GEDCOM_PERSONS} individus maximum)`)
  }
  const sources = new Map<string, string>()
  for (const n of records) {
    if (n.tag === 'SOUR' && n.xref && n.text('TITL') != null) sources.set(n.xref, n.text('TITL')!)
  }

  const result: ParsedGedcom = { persons: [], couples: [], parentLinks: [], relations: [] }
  const known = new Set<string>()
  const pedigree = new Map<string, LinkType>()
  for (const n of records) {
    if (n.tag === 'INDI' && n.xref) {
      known.add(n.xref)
      result.persons.push({ xref: n.xref, data: toPerson(n, sources) })
      for (const famc of n.all('FAMC')) pedigree.set(`${famc.value}>${n.xref}`, pedigreeType(famc.text('PEDI')))
    }
  }

  for (const n of records) {
    if (n.tag !== 'INDI' || !n.xref) continue
    for (const asso of n.all('ASSO')) {
      if (known.has(asso.value) && asso.value !== n.xref) {
        result.relations.push({
          person: asso.value,
          related: n.xref,
          type: relationType(asso.text('RELA')),
          note: cut(trimToNull(asso.text('NOTE')), 255),
        })
      }
    }
  }

  const seenLinks = new Set<string>()
  for (const fam of records) {
    if (fam.tag !== 'FAM') continue
    const husband = known.has(fam.text('HUSB') ?? '') ? fam.text('HUSB')! : null
    const wife = known.has(fam.text('WIFE') ?? '') ? fam.text('WIFE')! : null
    if (husband && wife && husband !== wife) {
      const couple: ParsedCouple = { xref1: husband, xref2: wife, type: 'MARRIAGE', start: null, startPlace: null, end: null, endReason: null }
      const marr = fam.child('MARR')
      const marc = fam.child('MARC')
      const div = fam.child('DIV')
      const sep = fam.child('_SEPARATION')
      if (marr) {
        couple.start = parseDate(marr.text('DATE'))
        couple.startPlace = trimToNull(marr.text('PLAC'))
        const kind = marr.text('TYPE')?.toLowerCase() ?? ''
        if (kind === 'pacs') couple.type = 'PACS'
        else if (/(partnership|union libre|cohabit)/.test(kind)) couple.type = 'PARTNERSHIP'
      } else if (marc) {
        couple.type = 'PARTNERSHIP'
        couple.start = parseDate(marc.text('DATE'))
        couple.startPlace = trimToNull(marc.text('PLAC'))
      }
      if (div) {
        couple.end = parseDate(div.text('DATE'))
        couple.endReason = 'DIVORCE'
      } else if (sep) {
        couple.end = parseDate(sep.text('DATE'))
        couple.endReason = 'SEPARATION'
      }
      result.couples.push(couple)
    }
    for (const chil of fam.all('CHIL')) {
      if (!known.has(chil.value)) continue
      const type = pedigree.get(`${fam.xref}>${chil.value}`) ?? 'BIOLOGICAL'
      for (const parent of [husband, wife]) {
        if (parent && parent !== chil.value && !seenLinks.has(`${parent}>${chil.value}`)) {
          seenLinks.add(`${parent}>${chil.value}`)
          result.parentLinks.push({ parent, child: chil.value, type })
        }
      }
    }
  }
  return result
}

export function importGedcom(state: DemoState, data: Uint8Array, treeName: string): ImportResult {
  const parsed = parseGedcom(data)
  const treeId = state.nextId++
  state.trees.push({ id: treeId, name: treeName, selfPersonId: null })

  const ids = new Map<string, number>()
  for (const { xref, data: fields } of parsed.persons) {
    const id = state.nextId++
    ids.set(xref, id)
    state.persons.push({ ...fields, id, treeId, deletedAt: null, photo: null })
  }
  for (const r of parsed.relations) {
    state.relations.push({ id: state.nextId++, treeId, personId: ids.get(r.person)!, relatedId: ids.get(r.related)!, type: r.type, note: r.note })
  }
  for (const c of parsed.couples) {
    const { xref1, xref2, ...rest } = c
    state.couples.push({ id: state.nextId++, treeId, person1Id: ids.get(xref1)!, person2Id: ids.get(xref2)!, ...rest })
  }
  for (const l of parsed.parentLinks) {
    state.parentLinks.push({ id: state.nextId++, treeId, parentId: ids.get(l.parent)!, childId: ids.get(l.child)!, linkType: l.type })
  }
  return { treeId, persons: parsed.persons.length, couples: parsed.couples.length, parentLinks: parsed.parentLinks.length }
}

const familyKey = (a: number, b: number | null) => {
  const y = b ?? -1
  return `${Math.min(a, y)}-${Math.max(a, y)}`
}

function formatDate(d: PDate): string {
  const parts: (string | number)[] = []
  if (d.approximate) parts.push('ABT')
  if (d.day != null && d.month != null) parts.push(d.day)
  if (d.month != null) parts.push(MONTHS[d.month - 1])
  if (d.year != null) parts.push(d.year)
  return parts.join(' ')
}

const isEmptyDate = (d: PDate | null): d is null => !d || (d.year == null && d.month == null && d.day == null)

function event(out: string[], tag: string, date: PDate | null, place: string | null, flag: boolean) {
  const noDate = isEmptyDate(date)
  if (noDate && place == null && !flag) return
  out.push(`1 ${tag}${noDate && place == null ? ' Y' : ''}`)
  if (!noDate) out.push(`2 DATE ${formatDate(date)}`)
  if (place != null) out.push(`2 PLAC ${place}`)
}

export function exportGedcom(people: PersonRecord[], links: TreeLinks): string {
  const byId = new Map(people.map((p) => [p.id, p]))
  const relationsByTarget = new Map<number, TreeLinks['relations']>()
  for (const r of links.relations) relationsByTarget.set(r.relatedId, [...(relationsByTarget.get(r.relatedId) ?? []), r])

  const families = new Map<string, Family>()
  const newFamily = (): Family => ({ id: '', husband: null, wife: null, couple: null, children: [], types: new Map() })
  const familyOf = (key: string) => {
    let f = families.get(key)
    if (!f) families.set(key, (f = newFamily()))
    return f
  }
  for (const c of links.couples) {
    const f = familyOf(familyKey(c.person1Id, c.person2Id))
    f.husband = c.person1Id
    f.wife = c.person2Id
    f.couple = c
  }
  const byChild = new Map<number, TreeLinks['parentChild']>()
  for (const l of links.parentChild) byChild.set(l.childId, [...(byChild.get(l.childId) ?? []), l])

  for (const [child, entries] of byChild) {
    const parents = [...entries].sort((a, b) => Number(byId.get(a.parentId)?.sex === 'FEMALE') - Number(byId.get(b.parentId)?.sex === 'FEMALE'))
    const typeOf = new Map(parents.map((l) => [l.parentId, l.linkType]))

    const covered = new Set<number>()
    for (const c of links.couples) {
      if (typeOf.has(c.person1Id) && typeOf.has(c.person2Id)) {
        const f = families.get(familyKey(c.person1Id, c.person2Id))!
        f.children.push(child)
        const a = typeOf.get(c.person1Id)!
        const b = typeOf.get(c.person2Id)!
        f.types.set(child, a !== 'BIOLOGICAL' ? a : b)
        covered.add(c.person1Id)
        covered.add(c.person2Id)
      }
    }
    const rest = parents.map((l) => l.parentId).filter((id) => !covered.has(id))
    for (let i = 0; i < rest.length; i += 2) {
      const first = rest[i]
      const second = i + 1 < rest.length ? rest[i + 1] : null
      const f = familyOf(familyKey(first, second))
      if (f.husband == null && f.wife == null) {
        f.husband = first
        f.wife = second
      }
      f.children.push(child)
      f.types.set(child, typeOf.get(first)!)
    }
  }

  const hasNonBio = (f: Family) => [...f.types.values()].some((t) => t !== 'BIOLOGICAL')
  const ordered = [...families.values()].sort((a, b) => Number(hasNonBio(a)) - Number(hasNonBio(b)))

  const famById = new Map<string, Family>()
  const asSpouse = new Map<number, string[]>()
  const asChild = new Map<number, string[]>()
  ordered.forEach((f, i) => {
    f.id = `@F${i + 1}@`
    famById.set(f.id, f)
    for (const spouse of [f.husband, f.wife]) {
      if (spouse != null) asSpouse.set(spouse, [...(asSpouse.get(spouse) ?? []), f.id])
    }
    for (const child of f.children) asChild.set(child, [...(asChild.get(child) ?? []), f.id])
  })

  const out: string[] = ['0 HEAD', '1 SOUR FamilyTree', '1 GEDC', '2 VERS 5.5.1', '2 FORM LINEAGE-LINKED', '1 CHAR UTF-8']
  for (const p of people) {
    out.push(`0 @I${p.id}@ INDI`)
    out.push(`1 NAME ${p.firstName}${p.middleNames != null ? ' ' + p.middleNames : ''} /${p.lastName}/`)
    if (p.birthName != null && p.birthName !== p.lastName) out.push(`1 NAME ${p.firstName} /${p.birthName}/`, '2 TYPE birth')
    if (p.nickname != null) out.push(`1 NICK ${p.nickname}`)
    if (p.sex !== 'UNKNOWN') out.push(`1 SEX ${p.sex === 'MALE' ? 'M' : 'F'}`)
    event(out, 'BIRT', p.birth, p.birthPlace, false)
    event(out, 'DEAT', p.death, p.deathPlace, p.deceased)
    if (p.occupation != null) out.push(`1 OCCU ${p.occupation}`)
    if (p.biography != null) {
      const lines = p.biography.split(/\r?\n/)
      out.push(`1 NOTE ${lines[0]}`, ...lines.slice(1).map((l) => `2 CONT ${l}`))
    }
    if (p.source != null) {
      out.push(`1 SOUR ${p.source}`)
      if (p.sourceReliability != null) out.push(`2 QUAY ${{ LOW: 1, MEDIUM: 2, HIGH: 3 }[p.sourceReliability]}`)
    }
    if (p.birthKind !== 'LIVE') out.push(`1 _BIRTHKIND ${p.birthKind}`)
    if (p.twinGroup != null) out.push(`1 _TWIN ${p.twinGroup}`)
    for (const r of relationsByTarget.get(p.id) ?? []) {
      const rela = { GODPARENT: 'Godparent', WITNESS: 'Witness', GUARDIAN: 'Guardian', OTHER: 'Other' }[r.type]
      out.push(`1 ASSO @I${r.personId}@`, `2 RELA ${rela}`)
      if (r.note != null) out.push(`2 NOTE ${r.note}`)
    }
    for (const f of asSpouse.get(p.id) ?? []) out.push(`1 FAMS ${f}`)
    for (const f of asChild.get(p.id) ?? []) {
      out.push(`1 FAMC ${f}`)
      const pedi = { ADOPTIVE: 'adopted', FOSTER: 'foster', STEP: 'step', LEGAL: 'legal' } as Partial<Record<LinkType, string>>
      const type = famById.get(f)!.types.get(p.id)
      if (type && pedi[type]) out.push(`2 PEDI ${pedi[type]}`)
    }
  }
  for (const f of ordered) {
    out.push(`0 ${f.id} FAM`)
    if (f.husband != null) out.push(`1 HUSB @I${f.husband}@`)
    if (f.wife != null) out.push(`1 WIFE @I${f.wife}@`)
    for (const child of f.children) out.push(`1 CHIL @I${child}@`)
    const c = f.couple
    if (c) {
      if (c.type === 'PARTNERSHIP') {
        event(out, 'MARC', c.start, c.startPlace, true)
      } else {
        event(out, 'MARR', c.start, c.startPlace, true)
        if (c.type === 'PACS') out.push('2 TYPE PACS')
      }
      if (c.endReason === 'DIVORCE') event(out, 'DIV', c.end, null, true)
      else if (c.endReason === 'SEPARATION') event(out, '_SEPARATION', c.end, null, true)
    }
  }
  out.push('0 TRLR')
  return out.join('\n') + '\n'
}
