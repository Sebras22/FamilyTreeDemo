import type { ReactNode } from 'react'
import type { Person } from '@/interfaces/api/Person'
import type { MenuItem } from '@/interfaces/components/MenuItem'
import type { ViewMode } from '@/interfaces/domain/ViewMode'

export interface WorkspaceToolbarProps {
  persons: Person[]
  viewMode: ViewMode
  depth: number
  focusPerson: Person | undefined
  canFocusSelf: boolean
  canEdit: boolean
  primaryAction: ReactNode
  menuItems: MenuItem[]
  onPick: (id: number) => void
  onViewModeChange: (mode: ViewMode) => void
  onDepthChange: (depth: number) => void
  onFocusSelf: () => void
  onAddPerson: () => void
}
