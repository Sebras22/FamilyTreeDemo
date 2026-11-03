import type { Graph } from '@/interfaces/domain/Graph'

export interface ListDialogProps {
  treeId: number
  graph: Graph
  canEdit: boolean
  onChanged: () => Promise<void> | void
  onSelect: (id: number) => void
  onClose: () => void
}
