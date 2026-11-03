import type { CommentItem } from '@/interfaces/api/CommentItem'
import type { Couple } from '@/interfaces/api/Couple'
import type { CoupleInput } from '@/interfaces/api/CoupleInput'
import type { DuplicateGroup } from '@/interfaces/api/DuplicateGroup'
import type { HistoryItem } from '@/interfaces/api/HistoryItem'
import type { LinkType } from '@/interfaces/api/LinkType'
import type { Page } from '@/interfaces/api/Page'
import type { ParentLink } from '@/interfaces/api/ParentLink'
import type { Person } from '@/interfaces/api/Person'
import type { PersonInput } from '@/interfaces/api/PersonInput'
import type { Relation } from '@/interfaces/api/Relation'
import type { RelationType } from '@/interfaces/api/RelationType'
import type { Tree } from '@/interfaces/api/Tree'
import type { TreeLinks } from '@/interfaces/api/TreeLinks'
import type { User } from '@/interfaces/api/User'

export interface Api {

  me: () => Promise<User>

  listTrees: () => Promise<Tree[]>
  createTree: (name: string) => Promise<Tree>
  renameTree: (id: number, name: string) => Promise<Tree>
  deleteTree: (id: number) => Promise<void>
  setSelf: (id: number, personId: number | null) => Promise<Tree>
  importGedcom: (file: File, name: string) => Promise<{ treeId: number; persons: number; couples: number; parentLinks: number }>
  exportGedcom: (id: number, name: string) => Promise<void>

  listPersons: (treeId: number, page: number, size?: number) => Promise<Page<Person>>
  createPerson: (treeId: number, p: PersonInput) => Promise<Person>
  createPersons: (treeId: number, persons: PersonInput[]) => Promise<Person[]>
  updatePerson: (id: number, p: PersonInput) => Promise<Person>
  deletePerson: (id: number) => Promise<void>
  deletePersons: (treeId: number, ids: number[]) => Promise<void>
  restorePerson: (id: number) => Promise<Person>
  purgePerson: (id: number) => Promise<void>
  mergePersons: (keepId: number, removeId: number) => Promise<Person>
  trash: (treeId: number) => Promise<Person[]>
  emptyTrash: (treeId: number) => Promise<void>
  duplicates: (treeId: number) => Promise<DuplicateGroup[]>
  history: (treeId: number) => Promise<HistoryItem[]>

  uploadPhoto: (id: number, file: File) => Promise<Person>
  deletePhoto: (id: number) => Promise<void>
  photo: (id: number) => Promise<Blob>

  links: (treeId: number) => Promise<TreeLinks>
  addParentLink: (treeId: number, parentId: number, childId: number, linkType: LinkType) => Promise<ParentLink>
  updateParentLink: (treeId: number, id: number, linkType: LinkType) => Promise<ParentLink>
  deleteParentLink: (treeId: number, id: number) => Promise<void>
  addCouple: (treeId: number, c: CoupleInput) => Promise<Couple>
  updateCouple: (treeId: number, id: number, c: CoupleInput) => Promise<Couple>
  deleteCouple: (treeId: number, id: number) => Promise<void>
  addRelation: (treeId: number, personId: number, relatedId: number, type: RelationType, note: string | null) => Promise<Relation>
  deleteRelation: (treeId: number, id: number) => Promise<void>

  comments: (personId: number) => Promise<CommentItem[]>
  addComment: (personId: number, content: string) => Promise<CommentItem>
  deleteComment: (personId: number, id: number) => Promise<void>
}
