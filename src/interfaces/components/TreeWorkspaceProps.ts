import type { ReactNode } from 'react'
import type { Person } from '@/interfaces/api/Person'
import type { Role } from '@/interfaces/api/Role'
import type { MenuItem } from '@/interfaces/components/MenuItem'
import type { Graph } from '@/interfaces/domain/Graph'

export interface TreeWorkspaceProps {
  treeId: number | null
  role: Role | null
  graph: Graph
  persons: Person[]
  loading: boolean
  loadingMore: boolean
  reload: () => Promise<void>
  selfId?: number | null
  onSetSelf?: (personId: number | null) => Promise<void>
  primaryAction?: ReactNode
  tools?: MenuItem[]
  personUrl?: (id: number) => string
}
