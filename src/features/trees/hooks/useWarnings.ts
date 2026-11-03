import { useCallback, useMemo, useState } from 'react'
import { findWarnings, warningKey } from '@/domain/consistency'
import type { Graph } from '@/interfaces/domain/Graph'
import type { Warning } from '@/interfaces/domain/Warning'

const storageKey = (treeId: number | null) => `confirmed-warnings:${treeId ?? 'shared'}`

function load(treeId: number | null): Set<string> {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(storageKey(treeId)) ?? '[]'))
  } catch {
    return new Set()
  }
}

export function useWarnings(graph: Graph, treeId: number | null) {
  const [confirmedKeys, setConfirmedKeys] = useState(() => load(treeId))
  const base = useMemo(() => findWarnings(graph), [graph])

  const warnings = useMemo(() => {
    const out = new Map<number, Warning[]>()
    for (const [id, list] of base) out.set(id, list.map((w) => (confirmedKeys.has(warningKey(w)) ? { ...w, confirmed: true } : w)))
    return out
  }, [base, confirmedKeys])

  const setConfirmed = useCallback(
    (w: Warning, value: boolean) =>
      setConfirmedKeys((prev) => {
        const next = new Set(prev)
        if (value) next.add(warningKey(w))
        else next.delete(warningKey(w))
        try {
          localStorage.setItem(storageKey(treeId), JSON.stringify([...next]))
        } catch {
        }
        return next
      }),
    [treeId],
  )

  return { warnings, setConfirmed }
}
