import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@/shared/api/api'
import { buildGraph } from '@/domain/graph'
import type { Person } from '@/interfaces/api/Person'
import type { TreeData } from '@/interfaces/state/TreeData'
import type { TreeLinks } from '@/interfaces/api/TreeLinks'

const EMPTY_LINKS: TreeLinks = { parentChild: [], couples: [], relations: [] }

export function useTreeData(treeId: number | null): TreeData {
  const [persons, setPersons] = useState<Person[]>([])
  const [links, setLinks] = useState<TreeLinks>(EMPTY_LINKS)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const generation = useRef(0)
  const loaded = useRef(false)

  const reload = useCallback(async () => {
    if (treeId == null) return
    const mine = ++generation.current
    try {
      setError(null)
      const [first, l] = await Promise.all([api.listPersons(treeId, 0), api.links(treeId)])
      if (mine !== generation.current) return
      setLinks(l)
      if (!loaded.current || first.last) {
        setPersons(first.content)
        loaded.current = true
        setLoading(false)
      }
      let all = first.content
      let last = first.last
      let page = 1
      setLoadingMore(!last)
      while (!last) {
        const next = await api.listPersons(treeId, page++)
        if (mine !== generation.current) return
        all = [...all, ...next.content]
        last = next.last
        setPersons(all)
      }
      setPersons(all)
      setLoadingMore(false)
    } catch (e) {
      if (mine === generation.current) {
        setError(e instanceof Error ? e.message : String(e))
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }, [treeId])

  useEffect(() => {
    loaded.current = false
    setLoading(true)
    setPersons([])
    setLinks(EMPTY_LINKS)
    reload()
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- compteur volontairement lu à la fermeture
      generation.current++
    }
  }, [reload])

  const graph = useMemo(() => buildGraph(persons, links), [persons, links])
  return { persons, links, graph, loading, loadingMore, error, reload }
}
