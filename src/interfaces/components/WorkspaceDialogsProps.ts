import type { Person } from '@/interfaces/api/Person'
import type { Role } from '@/interfaces/api/Role'
import type { WorkspaceDialog } from '@/interfaces/components/WorkspaceDialog'
import type { Graph } from '@/interfaces/domain/Graph'

export interface WorkspaceDialogsProps {
  dialog: WorkspaceDialog
  treeId: number | null
  role: Role | null
  graph: Graph
  canEdit: boolean
  reload: () => Promise<void>
  onClose: () => void
  onSelect: (id: number) => void
  onSaved: (person: Person) => void
  onWizardDone: (id: number) => void
}
