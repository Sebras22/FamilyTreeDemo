import type { Person } from '@/interfaces/api/Person'

export interface MiniCardProps {
  person: Person
  to: string
  hint?: string
}
