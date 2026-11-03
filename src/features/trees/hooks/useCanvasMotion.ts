import { useCallback, useEffect, useRef, useState } from 'react'
import { useReactFlow } from '@xyflow/react'

export function useSettling(trigger: unknown): boolean {
  const [settling, setSettling] = useState(false)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setSettling(true)
    const timer = setTimeout(() => setSettling(false), 500)
    return () => clearTimeout(timer)
  }, [trigger])
  return settling
}

export function useTidy(resetPositions: () => void) {
  const rf = useReactFlow()
  const [tidying, setTidying] = useState(false)
  const tidy = useCallback(() => {
    resetPositions()
    setTidying(true)
    setTimeout(() => rf.fitView({ padding: 0.2, duration: 600, maxZoom: 1.1 }), 60)
    setTimeout(() => setTidying(false), 800)
  }, [resetPositions, rf])
  return { tidying, tidy }
}
