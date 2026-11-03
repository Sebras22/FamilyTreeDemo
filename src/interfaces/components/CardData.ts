import type { Person } from '@/interfaces/api/Person'
import type { CanvasProps } from '@/interfaces/components/CanvasProps'
import type { Graph } from '@/interfaces/domain/Graph'
import type { Warning } from '@/interfaces/domain/Warning'

export interface CardData extends Record<string, unknown> {
  person: Person
  selected: boolean
  estimated: boolean
  warningCount: number
  warningTone: 'error' | 'doubt' | null
  onConfirmWarning: CanvasProps['onConfirmWarning']
  childCount: number
  collapsed: boolean
  onToggleCollapse: (id: number) => void
  animate: boolean
  canEdit: boolean
  onAdd: CanvasProps['onAdd']
  onContext: CanvasProps['onContext']
  graph: Graph
  focusId: number | null
  warnings: Warning[]
}
