import { ancestors, descendants, partnerOf } from './graph'
import type { Graph } from '@/interfaces/domain/Graph'
import type { ViewMode } from '@/interfaces/domain/ViewMode'

export function computeVisibleIds(graph: Graph, viewMode: ViewMode, focusId: number | null, depth: number, collapsed: Set<number>): Set<number> {
  let ids: Set<number>
  if (viewMode === 'focus' && focusId != null && graph.persons.has(focusId)) {
    const limit = depth === 0 ? Infinity : depth
    ids = new Set([focusId, ...ancestors(graph, focusId, limit).keys(), ...descendants(graph, focusId, limit).keys()])
    for (const id of [...ids]) for (const c of graph.couplesOf.get(id) ?? []) ids.add(partnerOf(c, id))
  } else {
    ids = new Set(graph.persons.keys())
  }
  const hidden = new Set<number>()
  for (const root of collapsed) {
    if (!ids.has(root)) continue
    for (const id of descendants(graph, root).keys()) hidden.add(id)
  }
  for (const id of [...hidden]) {
    for (const c of graph.couplesOf.get(id) ?? []) {
      const other = partnerOf(c, id)
      if (!hidden.has(other) && !collapsed.has(other) && (graph.parentsOf.get(other) ?? []).length === 0) hidden.add(other)
    }
  }
  return new Set([...ids].filter((id) => !hidden.has(id)))
}
