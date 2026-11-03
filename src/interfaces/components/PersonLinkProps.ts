import type { Graph } from '@/interfaces/domain/Graph'

export interface PersonLinkProps {
  graph: Graph
  id: number
  onSelect: (id: number) => void
}
