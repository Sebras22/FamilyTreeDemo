import type { Person } from '@/interfaces/api/Person'
import type { Graph } from '@/interfaces/domain/Graph'

export interface WorkspaceKeyboardOptions {
  active: boolean
  selected: Person | null
  multiIds: number[]
  graph: Graph
  canEdit: boolean
  goTo: (id: number) => void
  focusOn: (id: number) => void
  onDelete: (person: Person) => void
  deleteMany: (ids: number[]) => void
  onHelp: () => void
  onEscape: () => void
}
