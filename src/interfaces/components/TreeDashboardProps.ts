import type { Role } from '@/interfaces/api/Role'
import type { Graph } from '@/interfaces/domain/Graph'
import type { Warning } from '@/interfaces/domain/Warning'

export interface TreeDashboardProps {
  graph: Graph
  warnings: Map<number, Warning[]>
  treeId: number | null
  role: Role | null
  onOpenPerson: (id: number) => void
}
