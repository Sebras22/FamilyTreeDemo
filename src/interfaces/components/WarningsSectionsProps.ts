import type { Graph } from '@/interfaces/domain/Graph'
import type { Warning } from '@/interfaces/domain/Warning'

export interface WarningsSectionsProps {
  warnings: Warning[]
  graph: Graph
  onConfirmWarning: (w: Warning, confirmed: boolean) => void
}
