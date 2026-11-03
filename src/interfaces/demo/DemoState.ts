import type { CommentItem } from '@/interfaces/api/CommentItem'
import type { Couple } from '@/interfaces/api/Couple'
import type { HistoryItem } from '@/interfaces/api/HistoryItem'
import type { ParentLink } from '@/interfaces/api/ParentLink'
import type { Relation } from '@/interfaces/api/Relation'
import type { PersonRecord } from '@/interfaces/demo/PersonRecord'
import type { TreeRecord } from '@/interfaces/demo/TreeRecord'

export interface DemoState {
  trees: TreeRecord[]
  persons: PersonRecord[]
  parentLinks: (ParentLink & { treeId: number })[]
  couples: (Couple & { treeId: number })[]
  relations: (Relation & { treeId: number })[]
  comments: CommentItem[]
  history: (HistoryItem & { treeId: number })[]
  nextId: number
}
