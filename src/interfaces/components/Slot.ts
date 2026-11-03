import type { Person } from '@/interfaces/api/Person'

export interface Slot {
  person: Person | null
  gen: number
  index: number
}
