import type { Person } from '@/interfaces/api/Person'
import type { Role } from '@/interfaces/api/Role'
import type { RelateKind } from '@/interfaces/components/RelateKind'
import type { Graph } from '@/interfaces/domain/Graph'
import type { Warning } from '@/interfaces/domain/Warning'

export interface PersonPanelProps {
  treeId: number | null
  person: Person
  graph: Graph
  warnings: Warning[]
  onConfirmWarning: (w: Warning, confirmed: boolean) => void
  focusId: number | null
  role: Role | null
  selfId: number | null
  onSetSelf?: (personId: number | null) => Promise<void>
  personUrl?: (id: number) => string
  onClose: () => void
  onEdit: (person: Person) => void
  onAdd: (person: Person, kind: RelateKind) => void
  onDelete: (person: Person) => void
  onFocus: (id: number) => void
  onSelect: (id: number) => void
  onChanged: () => Promise<void> | void
}
