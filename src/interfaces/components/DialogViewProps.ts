import type { Pending } from '@/interfaces/ui/Pending'

export interface DialogViewProps {
  pending: Pending
  onClose: () => void
}
