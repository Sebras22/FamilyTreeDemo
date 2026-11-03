import { BaseEdge, Position, getSmoothStepPath, type EdgeProps } from '@xyflow/react'

export function FamilyEdge({ id, targetX, targetY, targetPosition, markerEnd, data, label }: EdgeProps) {
  const sx = (data?.sx as number) ?? targetX
  const sy = (data?.sy as number) ?? targetY
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: Position.Bottom,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 14,
    offset: 24,
  })
  return <BaseEdge id={id} path={path} markerEnd={markerEnd} label={label} labelX={labelX} labelY={labelY} />
}
