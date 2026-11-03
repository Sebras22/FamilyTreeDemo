import type { Person } from '@/interfaces/api/Person'

export interface PersonPickerProps {
  persons: Person[]
  exclude?: number[]
  placeholder?: string
  onPick: (person: Person) => void
}
