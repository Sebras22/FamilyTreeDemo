import { MarkerType, type Edge } from '@xyflow/react'
import { CARD_H, CARD_W } from '@/domain/layout'
import type { useI18n } from '@/shared/i18n/i18n'
import type { Graph } from '@/interfaces/domain/Graph'
import type { Position as XY } from '@/interfaces/domain/Position'

export function buildEdges(
  graph: Graph,
  visibleIds: Set<number>,
  positionOf: (id: number) => XY,
  showRelations: boolean,
  t: ReturnType<typeof useI18n>['t'],
): Edge[] {
  const out: Edge[] = []
  const byChild = new Map<number, typeof graph.links.parentChild>()
  for (const l of graph.links.parentChild) {
    if (!visibleIds.has(l.parentId) || !visibleIds.has(l.childId)) continue
    byChild.set(l.childId, [...(byChild.get(l.childId) ?? []), l])
  }
  const linkLabel = (type: string) => (type === 'BIOLOGICAL' ? undefined : t(`link.${type}`))
  for (const [childId, links] of byChild) {
    const parentIds = new Set(links.map((l) => l.parentId))
    const typeOf = new Map(links.map((l) => [l.parentId, l.linkType]))
    const covered = new Set<number>()
    const usedPairs = new Set<string>()
    for (const c of graph.links.couples) {
      if (!parentIds.has(c.person1Id) || !parentIds.has(c.person2Id)) continue
      const pair = `${Math.min(c.person1Id, c.person2Id)}-${Math.max(c.person1Id, c.person2Id)}`
      if (usedPairs.has(pair)) continue
      usedPairs.add(pair)
      covered.add(c.person1Id)
      covered.add(c.person2Id)
      const a = positionOf(c.person1Id)
      const b = positionOf(c.person2Id)
      const type = typeOf.get(c.person1Id) !== 'BIOLOGICAL' ? typeOf.get(c.person1Id)! : typeOf.get(c.person2Id)!
      out.push({
        id: `f${c.id}-${childId}`,
        source: String(c.person1Id),
        target: String(childId),
        type: 'family',
        targetHandle: 't',
        className: `edge-parent edge-${type.toLowerCase()}`,
        label: linkLabel(type),
        data: { sx: (a.x + b.x) / 2 + CARD_W / 2, sy: (a.y + b.y) / 2 + CARD_H / 2 },
        markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
      })
    }
    for (const l of links) {
      if (covered.has(l.parentId)) continue
      out.push({
        id: `p${l.id}`,
        source: String(l.parentId),
        target: String(l.childId),
        sourceHandle: 'b',
        targetHandle: 't',
        type: 'smoothstep',
        className: `edge-parent edge-${l.linkType.toLowerCase()}`,
        label: linkLabel(l.linkType),
        markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
      })
    }
  }
  for (const c of graph.links.couples) {
    if (!visibleIds.has(c.person1Id) || !visibleIds.has(c.person2Id)) continue
    const a = positionOf(c.person1Id)
    const b = positionOf(c.person2Id)
    const leftFirst = (a?.x ?? 0) <= (b?.x ?? 0)
    out.push({
      id: `c${c.id}`,
      source: String(leftFirst ? c.person1Id : c.person2Id),
      target: String(leftFirst ? c.person2Id : c.person1Id),
      sourceHandle: 'r',
      targetHandle: 'l',
      type: 'straight',
      className: `edge-couple${c.endReason ? ' ended' : ''}`,
      label: c.endReason ? t(`endReason.${c.endReason}`) : undefined,
    })
  }
  if (showRelations) {
    for (const r of graph.links.relations) {
      if (!visibleIds.has(r.personId) || !visibleIds.has(r.relatedId)) continue
      out.push({
        id: `r${r.id}`,
        source: String(r.personId),
        target: String(r.relatedId),
        sourceHandle: 'b',
        targetHandle: 't',
        type: 'default',
        className: 'edge-relation',
        label: t(`relation.${r.type}`),
      })
    }
  }
  return out
}
