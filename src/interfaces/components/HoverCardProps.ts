import type { Person } from '@/interfaces/api/Person'
import type { Graph } from '@/interfaces/domain/Graph'
import type { Warning } from '@/interfaces/domain/Warning'

export interface HoverCardProps {
  person: Person
  graph: Graph
  focusId: number | null
  warnings: Warning[]
  anchor: DOMRect
}
