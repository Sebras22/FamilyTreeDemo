import { importGedcom } from './gedcom'
import gedcom from './famille-delacroix.ged?raw'
import type { DemoState } from '@/interfaces/demo/DemoState'

export function buildSeed(): DemoState {
  const state: DemoState = { trees: [], persons: [], parentLinks: [], couples: [], relations: [], comments: [], history: [], nextId: 1 }
  const { treeId } = importGedcom(state, new TextEncoder().encode(gedcom), 'Famille Delacroix (exemple)')
  const me = state.persons.find((p) => p.treeId === treeId && p.firstName === 'Hugo')
  state.trees[0].selfPersonId = me?.id ?? null
  return state
}
