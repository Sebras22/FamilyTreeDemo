import type { Graph } from '@/interfaces/domain/Graph'

export interface DuplicatesDialogProps {
  treeId: number
  graph: Graph
  onChanged: () => Promise<void> | void
  onClose: () => void
}
