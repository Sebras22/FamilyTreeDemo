import type { Person } from '@/interfaces/api/Person'
import type { TreeLinks } from '@/interfaces/api/TreeLinks'
import type { Graph } from '@/interfaces/domain/Graph'

export interface TreeData {
  persons: Person[]
  links: TreeLinks
  graph: Graph
  loading: boolean
  loadingMore: boolean
  error: string | null
  reload: () => Promise<void>
}
