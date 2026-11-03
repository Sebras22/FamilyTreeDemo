import { useCallback, useEffect, useState } from 'react'
import type { NodeChange } from '@xyflow/react'
import type { MultiSelectionOptions } from '@/interfaces/state/MultiSelectionOptions'

export function useMultiSelection({ selectedId, clearNonce, onMultiChange, onSelect }: MultiSelectionOptions) {
  const [multi, setMulti] = useState<Set<number>>(new Set())

  useEffect(() => {
    onMultiChange([...multi])
    if (multi.size >= 2) onSelect(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multi])

  useEffect(() => setMulti(new Set()), [clearNonce])

  useEffect(() => {
    if (selectedId != null && multi.size > 0 && !multi.has(selectedId)) setMulti(new Set())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  const applySelection = useCallback((changes: NodeChange[]) => {
    const picks = changes.filter((c): c is Extract<NodeChange, { type: 'select' }> => c.type === 'select')
    if (picks.length === 0) return
    setMulti((current) => {
      const next = new Set(current)
      for (const c of picks) {
        if (c.selected) next.add(Number(c.id))
        else next.delete(Number(c.id))
      }
      return next
    })
  }, [])

  const clear = useCallback(() => setMulti(new Set()), [])
  const only = useCallback((id: number) => setMulti(new Set([id])), [])

  return { multi, applySelection, clear, only }
}
