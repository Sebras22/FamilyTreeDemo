import type { Graph } from '@/interfaces/domain/Graph'
import type { Warning } from '@/interfaces/domain/Warning'

export interface CanvasProps {
  storageKey: number | null
  graph: Graph
  visibleIds: Set<number>
  warnings: Map<number, Warning[]>
  onConfirmWarning: (w: Warning, confirmed: boolean) => void
  selectedId: number | null
  focusId: number | null
  centerOn: { id: number; nonce: number } | null
  fitKey: string
  collapsed: Set<number>
  showRelations: boolean
  onMultiChange: (ids: number[]) => void
  clearNonce: number
  canEdit: boolean
  onAdd: (id: number, kind: 'PARENT' | 'SPOUSE' | 'CHILD') => void
  onContext: (id: number, x: number, y: number) => void
  onSelect: (id: number | null) => void
  onFocus: (id: number) => void
  onToggleCollapse: (id: number) => void
}
