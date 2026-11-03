import type { Position } from '@/interfaces/domain/Position'
import type { YearScale } from '@/interfaces/domain/YearScale'

export interface LayoutResult {
  positions: Map<number, Position>
  estimated: Set<number>
  scale: YearScale | null
}
