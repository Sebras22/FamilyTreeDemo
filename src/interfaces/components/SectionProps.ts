import type { Person } from '@/interfaces/api/Person'
import type { Graph } from '@/interfaces/domain/Graph'

export interface SectionProps {
  person: Person
  graph: Graph
  treeId: number | null
  canEdit: boolean
  run: (fn: () => Promise<unknown>) => Promise<void>
  onSelect: (id: number) => void
}
