import { useCallback, useEffect, useRef, useState } from 'react'
import type { NodeChange } from '@xyflow/react'
import type { Position as XY } from '@/interfaces/domain/Position'

function loadOverrides(key: number | null): Map<number, XY> {
  if (key == null) return new Map()
  try {
    const raw = localStorage.getItem(`layout:${key}`)
    return raw ? new Map(JSON.parse(raw) as [number, XY][]) : new Map()
  } catch {
    return new Map()
  }
}

function persistOverrides(key: number | null, map: Map<number, XY>) {
  if (key == null) return
  try {
    if (map.size === 0) localStorage.removeItem(`layout:${key}`)
    else localStorage.setItem(`layout:${key}`, JSON.stringify([...map]))
  } catch {
    return
  }
}

export function useNodePositions(storageKey: number | null, computed: Map<number, XY>) {
  const [overrides, setOverrides] = useState<Map<number, XY>>(() => loadOverrides(storageKey))
  useEffect(() => setOverrides(loadOverrides(storageKey)), [storageKey])

  const latest = useRef(overrides)
  useEffect(() => {
    latest.current = overrides
  }, [overrides])

  const positionOf = useCallback((id: number): XY => overrides.get(id) ?? computed.get(id) ?? { x: 0, y: 0 }, [overrides, computed])

  const applyMoves = useCallback((changes: NodeChange[]) => {
    const moves = changes.filter((c): c is Extract<NodeChange, { type: 'position' }> => c.type === 'position' && !!c.position)
    if (moves.length === 0) return
    setOverrides((current) => {
      const next = new Map(current)
      for (const m of moves) next.set(Number(m.id), m.position!)
      return next
    })
  }, [])

  const saveCurrent = useCallback(() => persistOverrides(storageKey, latest.current), [storageKey])

  const reset = useCallback(() => {
    const empty = new Map<number, XY>()
    setOverrides(empty)
    persistOverrides(storageKey, empty)
  }, [storageKey])

  return { positionOf, applyMoves, saveCurrent, reset }
}
