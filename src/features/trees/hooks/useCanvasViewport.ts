import { useEffect, useRef } from 'react'
import { useReactFlow } from '@xyflow/react'
import { CARD_H, CARD_W } from '@/domain/layout'
import type { CanvasProps } from '@/interfaces/components/CanvasProps'
import type { Position as XY } from '@/interfaces/domain/Position'

const FIT = { padding: 0.2, maxZoom: 1.1 }

export function useCanvasViewport(fitKey: string, centerOn: CanvasProps['centerOn'], positionOf: (id: number) => XY) {
  const rf = useReactFlow()

  useEffect(() => {
    const timer = setTimeout(() => rf.fitView({ ...FIT, duration: 400 }), 30)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || e.ctrlKey || e.metaKey) return
      if (e.key === '+' || e.key === '=') rf.zoomIn({ duration: 200 })
      else if (e.key === '-') rf.zoomOut({ duration: 200 })
      else if (e.key === '0') rf.fitView({ ...FIT, duration: 300 })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rf])

  const lastCenter = useRef<number>(0)
  useEffect(() => {
    if (!centerOn || centerOn.nonce === lastCenter.current) return
    const pos = positionOf(centerOn.id)
    lastCenter.current = centerOn.nonce
    rf.setCenter(pos.x + CARD_W / 2, pos.y + CARD_H / 2, { zoom: 1, duration: 400 })
  }, [centerOn, positionOf, rf])
}
