import { useEffect } from 'react'
import { partnerOf } from '@/domain/graph'
import type { Graph } from '@/interfaces/domain/Graph'
import type { Person } from '@/interfaces/api/Person'
import type { WorkspaceKeyboardOptions } from '@/interfaces/state/WorkspaceKeyboardOptions'

function siblingsOf(graph: Graph, person: Person): Person[] {
  const first = (graph.parentsOf.get(person.id) ?? [])[0]
  if (!first) return []
  return (graph.childrenOf.get(first.parentId) ?? [])
    .map((l) => graph.persons.get(l.childId))
    .filter((p): p is Person => !!p)
    .sort((a, b) => (a.birth?.year ?? 9999) - (b.birth?.year ?? 9999) || a.id - b.id)
}

export function useWorkspaceKeyboard({ active, selected, multiIds, graph, canEdit, goTo, focusOn, onDelete, deleteMany, onHelp, onEscape }: WorkspaceKeyboardOptions) {
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable) return
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || e.key === '/') {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('.toolbar .picker input')?.focus()
        return
      }
      if (e.key === '?') {
        onHelp()
        return
      }
      if (e.key === 'Escape') {
        onEscape()
        return
      }
      if (multiIds.length >= 2) {
        if ((e.key === 'Delete' || e.key === 'Backspace') && canEdit) {
          e.preventDefault()
          deleteMany(multiIds)
        }
        return
      }
      if (!selected) return
      const parents = graph.parentsOf.get(selected.id) ?? []
      const children = graph.childrenOf.get(selected.id) ?? []
      const step = (direction: 1 | -1) => {
        const siblings = siblingsOf(graph, selected)
        const index = siblings.findIndex((p) => p.id === selected.id)
        if (index >= 0 && siblings[index + direction]) return goTo(siblings[index + direction].id)
        const spouse = (graph.couplesOf.get(selected.id) ?? [])[0]
        if (spouse) goTo(partnerOf(spouse, selected.id))
      }
      switch (e.key) {
        case 'ArrowUp':
          if (parents[0]) goTo(parents[0].parentId)
          break
        case 'ArrowDown':
          if (children[0]) goTo(children[0].childId)
          break
        case 'ArrowLeft':
          step(-1)
          break
        case 'ArrowRight':
          step(1)
          break
        case 'Delete':
        case 'Backspace':
          if (canEdit) onDelete(selected)
          break
        case 'Enter':
          focusOn(selected.id)
          break
        default:
          return
      }
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, selected, multiIds, graph, canEdit, goTo, focusOn, onDelete, deleteMany, onHelp, onEscape])
}
