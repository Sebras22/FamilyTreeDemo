import type { Person } from '@/interfaces/api/Person'

export interface PhotoSectionProps {
  person: Person
  run: (fn: () => Promise<unknown>) => Promise<void>
}
