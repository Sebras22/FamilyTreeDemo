import type { Couple } from '@/interfaces/api/Couple'
import type { SectionProps } from '@/interfaces/components/SectionProps'

export interface UnionsSectionProps extends SectionProps {
  onEditCouple: (couple: Couple) => void
}
