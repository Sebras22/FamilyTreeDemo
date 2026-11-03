import type { Role } from '@/interfaces/api/Role'

export interface TrashDialogProps {
  treeId: number
  role: Role
  onChanged: () => Promise<void> | void
  onClose: () => void
}
