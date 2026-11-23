import type { NodeChange } from '@xyflow/react'
import type { NodeSize } from '@/interfaces/domain/NodeSize'

export function mergeMeasures(current: Map<string, NodeSize>, changes: NodeChange[]): Map<string, NodeSize> {
  let next: Map<string, NodeSize> | null = null
  for (const change of changes) {
    if (change.type !== 'dimensions' || !change.dimensions) continue
    const { width, height } = change.dimensions
    const known = (next ?? current).get(change.id)
    if (known && known.width === width && known.height === height) continue
    next ??= new Map(current)
    next.set(change.id, { width, height })
  }
  return next ?? current
}
