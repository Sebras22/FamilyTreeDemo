import { ApiError } from '../apiError'
import { assertGedcomSize, exportGedcom, importGedcom } from './gedcom'
import { nextId, state } from './store'
import type { Api } from '@/interfaces/api/Api'
import type { CommentItem } from '@/interfaces/api/CommentItem'
import type { Couple } from '@/interfaces/api/Couple'
import type { CoupleInput } from '@/interfaces/api/CoupleInput'
import type { DuplicateGroup } from '@/interfaces/api/DuplicateGroup'
import type { HistoryItem } from '@/interfaces/api/HistoryItem'
import type { LabelProps } from '@/interfaces/components/LabelProps'
import type { Page } from '@/interfaces/api/Page'
import type { ParentLink } from '@/interfaces/api/ParentLink'
import type { Person } from '@/interfaces/api/Person'
import type { PersonInput } from '@/interfaces/api/PersonInput'
import type { PersonRecord } from '@/interfaces/demo/PersonRecord'
import type { Relation } from '@/interfaces/api/Relation'
import type { ToTreeProps } from '@/interfaces/components/ToTreeProps'
import type { Tree } from '@/interfaces/api/Tree'
import type { TreeLinks } from '@/interfaces/api/TreeLinks'
import type { User } from '@/interfaces/api/User'

const DEMO_USER: User = { id: 1, displayName: 'Visiteur' }
const MAX_AGE = 110
const delay = <T>(value: T): Promise<T> => Promise.resolve(structuredClone(value))
const fail = (status: number, message: string) => new ApiError(status, message)

const isEmptyDate = (d: { year: number | null; month: number | null; day: number | null } | null) =>
  !d || (d.year == null && d.month == null && d.day == null)

const isLiving = (p: PersonRecord) => {
  if (p.deceased || !isEmptyDate(p.death) || p.birthKind !== 'LIVE') return false
  const year = p.birth?.year
  return year == null || year >= new Date().getFullYear() - MAX_AGE
}

const blank = (value: string | null | undefined) => (value == null || value.trim() === '' ? null : value.trim())

const norm = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')

const livePersons = (treeId: number) => state.persons.filter((p) => p.treeId === treeId && p.deletedAt == null)
const isLive = (id: number) => state.persons.some((p) => p.id === id && p.deletedAt == null)
const findPerson = (id: number) => {
  const p = state.persons.find((x) => x.id === id)
  if (!p) throw fail(404, 'Personne introuvable')
  return p
}
const findTree = (id: number) => {
  const t = state.trees.find((x) => x.id === id)
  if (!t) throw fail(404, 'Arbre introuvable')
  return t
}

const floatingIds = (): Set<number> => {
  const withDeleted = new Set<number>()
  const withLive = new Set<number>()
  for (const l of state.parentLinks) {
    if (isLive(l.parentId)) withLive.add(l.childId)
    else withDeleted.add(l.childId)
  }
  return new Set([...withDeleted].filter((id) => !withLive.has(id)))
}

const toPerson = (p: PersonRecord, floating: Set<number>): Person => {
  const { photo, ...rest } = p
  return { ...rest, living: isLiving(p), floating: floating.has(p.id), hasPhoto: photo != null }
}

const label = (p: LabelProps) => `${p.firstName} ${p.lastName}`.trim()

const log = (treeId: number, action: string, p: PersonRecord) => {
  const item: HistoryItem & { treeId: number } = {
    id: nextId(),
    treeId,
    entityType: 'PERSON',
    entityId: p.id,
    action,
    label: label(p),
    userName: DEMO_USER.displayName,
    createdAt: new Date().toISOString(),
  }
  state.history.unshift(item)
}

function apply(p: PersonRecord, r: PersonInput) {
  p.firstName = r.firstName.trim()
  p.middleNames = blank(r.middleNames)
  p.lastName = r.lastName.trim()
  p.birthName = blank(r.birthName)
  p.nickname = blank(r.nickname)
  p.sex = r.sex
  p.birth = r.birth
  p.birthPlace = blank(r.birthPlace)
  p.death = r.death
  p.deathPlace = blank(r.deathPlace)
  p.birthKind = r.birthKind ?? 'LIVE'
  p.deceased = r.deceased || !isEmptyDate(p.death) || p.birthKind !== 'LIVE'
  p.twinGroup = blank(r.twinGroup)
  p.occupation = blank(r.occupation)
  p.biography = blank(r.biography)
  p.source = blank(r.source)
  p.sourceReliability = r.sourceReliability
}

function addParentLink(treeId: number, parentId: number, childId: number, linkType: ParentLink['linkType']): ParentLink {
  if (parentId === childId) throw fail(400, 'Une personne ne peut pas être son propre parent')
  for (const id of [parentId, childId]) {
    if (!livePersons(treeId).some((p) => p.id === id)) throw fail(400, `Personne introuvable dans cet arbre : ${id}`)
  }
  if (state.parentLinks.some((l) => l.parentId === parentId && l.childId === childId)) {
    throw fail(409, 'Ce lien de parenté existe déjà')
  }
  const link = { id: nextId(), treeId, parentId, childId, linkType: linkType ?? 'BIOLOGICAL' }
  state.parentLinks.push(link)
  return link
}

function applyCouple(couple: Couple, c: CoupleInput) {
  couple.type = c.type ?? 'MARRIAGE'
  couple.start = c.start
  couple.startPlace = blank(c.startPlace)
  couple.end = c.end
  couple.endReason = c.endReason
}

function addCouple(treeId: number, c: CoupleInput): Couple {
  if (c.person1Id === c.person2Id) throw fail(400, 'Une union lie deux personnes différentes')
  for (const id of [c.person1Id, c.person2Id]) {
    if (!livePersons(treeId).some((p) => p.id === id)) throw fail(400, `Personne introuvable dans cet arbre : ${id}`)
  }
  const couple = { id: nextId(), treeId, person1Id: c.person1Id, person2Id: c.person2Id } as Couple & { treeId: number }
  applyCouple(couple, c)
  state.couples.push(couple)
  return couple
}

function createPerson(treeId: number, input: PersonInput): Person {
  findTree(treeId)
  const record = { id: nextId(), treeId, deletedAt: null, photo: null } as PersonRecord
  apply(record, input)
  state.persons.push(record)
  const rel = input.relateTo
  if (rel) {
    const type = rel.linkType ?? 'BIOLOGICAL'
    const base = { type: 'MARRIAGE', start: null, startPlace: null, end: null, endReason: null } as const
    if (rel.kind === 'PARENT') addParentLink(treeId, record.id, rel.personId, type)
    else if (rel.kind === 'CHILD') addParentLink(treeId, rel.personId, record.id, type)
    else if (rel.kind === 'SPOUSE') addCouple(treeId, { person1Id: rel.personId, person2Id: record.id, ...base })
    else throw fail(400, 'Type de rattachement inconnu')
  }
  log(treeId, 'CREATE', record)
  return toPerson(record, floatingIds())
}

function softDelete(p: PersonRecord) {
  p.deletedAt = new Date().toISOString()
  log(p.treeId, 'DELETE', p)
}

function purge(p: PersonRecord) {
  if (p.deletedAt == null) throw fail(409, "La personne doit d'abord être supprimée")
  log(p.treeId, 'PURGE', p)
  state.persons = state.persons.filter((x) => x.id !== p.id)
  state.parentLinks = state.parentLinks.filter((l) => l.parentId !== p.id && l.childId !== p.id)
  state.couples = state.couples.filter((c) => c.person1Id !== p.id && c.person2Id !== p.id)
  state.relations = state.relations.filter((r) => r.personId !== p.id && r.relatedId !== p.id)
  state.comments = state.comments.filter((c) => c.personId !== p.id)
}

function merge(keep: PersonRecord, remove: PersonRecord): Person {
  if (keep.id === remove.id || keep.treeId !== remove.treeId) throw fail(400, 'Fusion impossible')
  const has = (parentId: number, childId: number) => state.parentLinks.some((l) => l.parentId === parentId && l.childId === childId)

  for (const link of state.parentLinks.filter((l) => l.childId === remove.id)) {
    if (link.parentId === keep.id || has(link.parentId, keep.id)) state.parentLinks = state.parentLinks.filter((l) => l !== link)
    else link.childId = keep.id
  }
  for (const link of state.parentLinks.filter((l) => l.parentId === remove.id)) {
    if (link.childId === keep.id || has(keep.id, link.childId)) state.parentLinks = state.parentLinks.filter((l) => l !== link)
    else link.parentId = keep.id
  }
  for (const couple of state.couples.filter((c) => c.person1Id === remove.id || c.person2Id === remove.id)) {
    const other = couple.person1Id === remove.id ? couple.person2Id : couple.person1Id
    if (other === keep.id) state.couples = state.couples.filter((c) => c !== couple)
    else if (couple.person1Id === remove.id) couple.person1Id = keep.id
    else couple.person2Id = keep.id
  }
  for (const rel of state.relations.filter((r) => r.personId === remove.id || r.relatedId === remove.id)) {
    const other = rel.personId === remove.id ? rel.relatedId : rel.personId
    if (other === keep.id) state.relations = state.relations.filter((r) => r !== rel)
    else if (rel.personId === remove.id) rel.personId = keep.id
    else rel.relatedId = keep.id
  }
  for (const c of state.comments.filter((x) => x.personId === remove.id)) c.personId = keep.id

  keep.middleNames ??= remove.middleNames
  keep.birthName ??= remove.birthName
  keep.nickname ??= remove.nickname
  if (isEmptyDate(keep.birth)) keep.birth = remove.birth
  keep.birthPlace ??= remove.birthPlace
  if (isEmptyDate(keep.death)) keep.death = remove.death
  keep.deathPlace ??= remove.deathPlace
  if (remove.deceased) keep.deceased = true
  keep.occupation ??= remove.occupation
  keep.biography ??= remove.biography
  keep.source ??= remove.source
  keep.sourceReliability ??= remove.sourceReliability
  if (keep.photo == null) {
    keep.photo = remove.photo
    remove.photo = null
  }

  remove.deletedAt = new Date().toISOString()
  log(keep.treeId, 'MERGE', keep)
  return toPerson(keep, floatingIds())
}

const compatible = (a: PersonRecord, b: PersonRecord) => {
  const ya = a.birth?.year
  const yb = b.birth?.year
  return ya == null || yb == null || Math.abs(ya - yb) <= 1
}

function duplicates(treeId: number): DuplicateGroup[] {
  const byName = new Map<string, PersonRecord[]>()
  for (const p of livePersons(treeId)) {
    const key = `${norm(p.firstName)}|${norm(p.lastName)}`
    byName.set(key, [...(byName.get(key) ?? []), p])
  }
  const groups: DuplicateGroup[] = []
  for (const same of byName.values()) {
    if (same.length < 2) continue
    const clusters: PersonRecord[][] = []
    for (const p of same) {
      const home = clusters.find((cluster) => cluster.every((o) => compatible(o, p)))
      if (home) home.push(p)
      else clusters.push([p])
    }
    for (const cluster of clusters) {
      if (cluster.length > 1) groups.push({ personIds: cluster.map((p) => p.id), reason: 'SAME_NAME' })
    }
  }
  return groups
}

const toTree = (t: ToTreeProps): Tree => ({
  id: t.id,
  name: t.name,
  role: 'OWNER',
  personCount: livePersons(t.id).length,
  selfPersonId: t.selfPersonId,
})

const treeLinks = (treeId: number): TreeLinks => ({
  parentChild: state.parentLinks.filter((l) => l.treeId === treeId && isLive(l.parentId) && isLive(l.childId)),
  couples: state.couples.filter((c) => c.treeId === treeId && isLive(c.person1Id) && isLive(c.person2Id)),
  relations: state.relations.filter((r) => r.treeId === treeId && isLive(r.personId) && isLive(r.relatedId)),
})

export const demoApi: Api = {
  me: () => delay(DEMO_USER),

  listTrees: () => delay(state.trees.map(toTree)),
  createTree: (name) => {
    const tree = { id: nextId(), name: name.trim(), selfPersonId: null }
    state.trees.push(tree)
    return delay(toTree(tree))
  },
  renameTree: (id, name) => {
    const tree = findTree(id)
    tree.name = name.trim()
    return delay(toTree(tree))
  },
  deleteTree: (id) => {
    findTree(id)
    state.trees = state.trees.filter((t) => t.id !== id)
    state.persons = state.persons.filter((p) => p.treeId !== id)
    state.parentLinks = state.parentLinks.filter((l) => l.treeId !== id)
    state.couples = state.couples.filter((c) => c.treeId !== id)
    state.relations = state.relations.filter((r) => r.treeId !== id)
    state.history = state.history.filter((h) => h.treeId !== id)
    return delay(undefined)
  },
  setSelf: (id, personId) => {
    const tree = findTree(id)
    tree.selfPersonId = personId
    return delay(toTree(tree))
  },
  importGedcom: async (file, name) => {
    assertGedcomSize(file.size)
    return importGedcom(state, new Uint8Array(await file.arrayBuffer()), name.trim() || file.name)
  },
  exportGedcom: (id, name) => {
    findTree(id)
    const gedcom = exportGedcom(livePersons(id), treeLinks(id))
    const url = URL.createObjectURL(new Blob([gedcom], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.ged`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return Promise.resolve()
  },

  listPersons: (treeId, page, size = 500) => {
    findTree(treeId)
    const all = livePersons(treeId).sort((a, b) => a.id - b.id)
    const floating = floatingIds()
    const totalPages = Math.max(1, Math.ceil(all.length / size))
    const result: Page<Person> = {
      content: all.slice(page * size, (page + 1) * size).map((p) => toPerson(p, floating)),
      page,
      size,
      totalElements: all.length,
      totalPages,
      last: page >= totalPages - 1,
    }
    return delay(result)
  },
  createPerson: (treeId, p) => delay(createPerson(treeId, p)),
  createPersons: (treeId, persons) => delay(persons.map((p) => createPerson(treeId, p))),
  updatePerson: (id, input) => {
    const p = findPerson(id)
    apply(p, input)
    log(p.treeId, 'UPDATE', p)
    return delay(toPerson(p, floatingIds()))
  },
  deletePerson: (id) => {
    softDelete(findPerson(id))
    return delay(undefined)
  },
  deletePersons: (treeId, ids) => {
    for (const p of livePersons(treeId).filter((x) => ids.includes(x.id))) softDelete(p)
    return delay(undefined)
  },
  restorePerson: (id) => {
    const p = findPerson(id)
    p.deletedAt = null
    log(p.treeId, 'RESTORE', p)
    return delay(toPerson(p, floatingIds()))
  },
  purgePerson: (id) => {
    purge(findPerson(id))
    return delay(undefined)
  },
  mergePersons: (keepId, removeId) => delay(merge(findPerson(keepId), findPerson(removeId))),
  trash: (treeId) => {
    const floating = floatingIds()
    return delay(state.persons.filter((p) => p.treeId === treeId && p.deletedAt != null).map((p) => toPerson(p, floating)))
  },
  emptyTrash: (treeId) => {
    for (const p of state.persons.filter((x) => x.treeId === treeId && x.deletedAt != null)) purge(p)
    return delay(undefined)
  },
  duplicates: (treeId) => delay(duplicates(treeId)),
  history: (treeId) =>
    delay(
      state.history
        .filter((h) => h.treeId === treeId)
        .map((h): HistoryItem => ({ id: h.id, entityType: h.entityType, entityId: h.entityId, action: h.action, label: h.label, userName: h.userName, createdAt: h.createdAt })),
    ),

  uploadPhoto: (id, file) => {
    const p = findPerson(id)
    p.photo = file
    return delay(toPerson(p, floatingIds()))
  },
  deletePhoto: (id) => {
    findPerson(id).photo = null
    return delay(undefined)
  },
  photo: (id) => {
    const photo = findPerson(id).photo
    return photo ? Promise.resolve(photo) : Promise.reject(fail(404, 'Pas de photo'))
  },

  links: (treeId) => delay(treeLinks(treeId)),
  addParentLink: (treeId, parentId, childId, linkType) => delay(addParentLink(treeId, parentId, childId, linkType)),
  updateParentLink: (treeId, id, linkType) => {
    const link = state.parentLinks.find((l) => l.id === id && l.treeId === treeId)
    if (!link) return Promise.reject(fail(404, 'Lien introuvable'))
    link.linkType = linkType ?? 'BIOLOGICAL'
    return delay(link)
  },
  deleteParentLink: (treeId, id) => {
    state.parentLinks = state.parentLinks.filter((l) => !(l.id === id && l.treeId === treeId))
    return delay(undefined)
  },
  addCouple: (treeId, c) => delay(addCouple(treeId, c)),
  updateCouple: (treeId, id, c) => {
    const couple = state.couples.find((x) => x.id === id && x.treeId === treeId)
    if (!couple) return Promise.reject(fail(404, 'Union introuvable'))
    applyCouple(couple, c)
    return delay(couple)
  },
  deleteCouple: (treeId, id) => {
    state.couples = state.couples.filter((c) => !(c.id === id && c.treeId === treeId))
    return delay(undefined)
  },
  addRelation: (treeId, personId, relatedId, type, note) => {
    if (personId === relatedId) return Promise.reject(fail(400, 'Une relation lie deux personnes différentes'))
    const relation = { id: nextId(), treeId, personId, relatedId, type, note: blank(note) } as Relation & { treeId: number }
    state.relations.push(relation)
    return delay(relation)
  },
  deleteRelation: (treeId, id) => {
    state.relations = state.relations.filter((r) => !(r.id === id && r.treeId === treeId))
    return delay(undefined)
  },

  comments: (personId) => delay(state.comments.filter((c) => c.personId === personId)),
  addComment: (personId, content) => {
    const item: CommentItem = {
      id: nextId(),
      personId,
      authorName: DEMO_USER.displayName,
      mine: true,
      content,
      createdAt: new Date().toISOString(),
    }
    state.comments.push(item)
    return delay(item)
  },
  deleteComment: (personId, id) => {
    state.comments = state.comments.filter((c) => !(c.id === id && c.personId === personId))
    return delay(undefined)
  },
}
