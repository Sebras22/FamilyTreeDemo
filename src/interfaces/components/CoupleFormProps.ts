import type { Couple } from '@/interfaces/api/Couple'

export interface CoupleFormProps {
  treeId: number
  couple: Couple
  title: string
  onClose: () => void
  onSaved: () => void
}
