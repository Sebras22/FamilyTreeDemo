import { Button } from '@mantine/core'
import { SquareDashedMousePointer } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Background, Controls, MiniMap, Panel, ReactFlow, ReactFlowProvider, type NodeChange } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { warningTone } from '@/domain/consistency'
import { CARD_H, CARD_W, computeLayout } from '@/domain/layout'
import { useI18n } from '@/shared/i18n/i18n'
import { useCanvasViewport } from '../hooks/useCanvasViewport'
import { useSettling, useTidy } from '../hooks/useCanvasMotion'
import { useMultiSelection } from '../hooks/useMultiSelection'
import { useNodePositions } from '../hooks/useNodePositions'
import { buildEdges } from './canvas/buildEdges'
import { FamilyEdge } from './canvas/FamilyEdge'
import { Legend } from './canvas/Legend'
import { PersonCard } from './canvas/PersonCard'
import { YearAxis } from './canvas/YearAxis'
import type { CanvasProps } from '@/interfaces/components/CanvasProps'
import type { CardNode } from '@/interfaces/components/CardNode'

const edgeTypes = { family: FamilyEdge }
const nodeTypes = { person: PersonCard }
const LARGE_ANIMATION_LIMIT = 120

function Canvas(props: CanvasProps) {
  const { storageKey, graph, visibleIds, warnings, onConfirmWarning, selectedId, focusId, centerOn, fitKey, collapsed, showRelations, onMultiChange, clearNonce, canEdit, onAdd, onContext, onSelect, onFocus, onToggleCollapse } = props
  const { t } = useI18n()

  const visiblePersons = useMemo(() => [...graph.persons.values()].filter((p) => visibleIds.has(p.id)), [graph, visibleIds])
  const layout = useMemo(() => computeLayout(visiblePersons, graph.links.parentChild, graph.links.couples), [visiblePersons, graph])

  const { multi, applySelection, clear, only } = useMultiSelection({ selectedId, clearNonce, onMultiChange, onSelect })
  const { positionOf, applyMoves, saveCurrent, reset } = useNodePositions(storageKey, layout.positions)
  const { tidying, tidy } = useTidy(reset)
  const settling = useSettling(collapsed)
  const [selectMode, setSelectMode] = useState(false)
  useCanvasViewport(fitKey, centerOn, positionOf)

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      applySelection(changes)
      applyMoves(changes)
    },
    [applySelection, applyMoves],
  )

  const nodes = useMemo<CardNode[]>(
    () =>
      visiblePersons.map((person) => {
        const selected = multi.has(person.id) || person.id === selectedId
        return {
          id: String(person.id),
          type: 'person',
          position: positionOf(person.id),
          width: CARD_W,
          height: CARD_H,
          selected,
          data: {
            person,
            selected,
            estimated: layout.estimated.has(person.id),
            warningCount: (warnings.get(person.id) ?? []).filter((w) => !w.confirmed).length,
            warningTone: warningTone(warnings.get(person.id)),
            onConfirmWarning,
            childCount: (graph.childrenOf.get(person.id) ?? []).length,
            collapsed: collapsed.has(person.id),
            onToggleCollapse,
            animate: visiblePersons.length < LARGE_ANIMATION_LIMIT,
            canEdit,
            onAdd,
            onContext,
            graph,
            focusId,
            warnings: warnings.get(person.id) ?? [],
          },
        }
      }),
    [visiblePersons, layout, positionOf, selectedId, multi, warnings, onConfirmWarning, graph, collapsed, onToggleCollapse, canEdit, onAdd, onContext, focusId],
  )

  const edges = useMemo(() => buildEdges(graph, visibleIds, positionOf, showRelations, t), [graph, visibleIds, positionOf, showRelations, t])

  return (
    <ReactFlow
      className={tidying ? 'tidying' : settling ? 'settling' : undefined}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodesConnectable={false}
      nodesDraggable
      onNodesChange={onNodesChange}
      onNodeDragStop={saveCurrent}
      elementsSelectable
      minZoom={0.1}
      maxZoom={2}
      selectionKeyCode="Shift"
      multiSelectionKeyCode={['Shift', 'Control', 'Meta']}
      selectionOnDrag={selectMode}
      panOnDrag={selectMode ? [1, 2] : true}
      onNodeClick={(e, node) => {
        if (e.shiftKey || e.ctrlKey || e.metaKey) return
        only(Number(node.id))
        onSelect(Number(node.id))
      }}
      onNodeDoubleClick={(_, node) => onFocus(Number(node.id))}
      onNodeContextMenu={(e, node) => {
        e.preventDefault()
        onContext(Number(node.id), e.clientX, e.clientY)
      }}
      onPaneClick={() => {
        clear()
        onSelect(null)
      }}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={24} />
      {layout.scale && <YearAxis scale={layout.scale} />}
      <Controls showInteractive={false} />
      <MiniMap pannable zoomable className="minimap" nodeColor="var(--muted)" maskColor="color-mix(in srgb, var(--bg) 72%, transparent)" />
      <Panel position="top-left">
        <Legend />
      </Panel>
      <Panel position="top-right">
        <div className="row">
          <Button
            variant={selectMode ? 'light' : 'default'}
            onClick={() => setSelectMode((v) => !v)}
            aria-pressed={selectMode}
            title={t('canvas.selectHint')}
            leftSection={<SquareDashedMousePointer size={16} />}
          >
            {t('canvas.select')}
          </Button>
          <Button onClick={tidy} title={t('canvas.tidyHint')}>
            {t('canvas.tidy')}
          </Button>
        </div>
      </Panel>
    </ReactFlow>
  )
}

export default function TreeCanvas(props: CanvasProps) {
  return (
    <div className="canvas">
      <ReactFlowProvider>
        <Canvas {...props} />
      </ReactFlowProvider>
    </div>
  )
}
