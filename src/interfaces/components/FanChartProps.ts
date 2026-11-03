import type { Graph } from '@/interfaces/domain/Graph'

export interface FanChartProps {
  graph: Graph
  focusId: number
  generations: number
  selectedId: number | null
  onSelect: (id: number) => void
  onFocus: (id: number) => void
}
