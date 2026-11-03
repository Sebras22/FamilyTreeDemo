import type { Person } from '@/interfaces/api/Person'
import type { RelateKind } from '@/interfaces/components/RelateKind'

export interface ContextMenuProps {
  person: Person
  x: number
  y: number
  canEdit: boolean
  onClose: () => void
  onFocus: (id: number) => void
  onEdit: (person: Person) => void
  onAdd: (id: number, kind: RelateKind) => void
  onDelete: (person: Person) => void
}
