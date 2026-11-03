import type { Person } from '@/interfaces/api/Person'

export interface CommentsProps {
  person: Person
  canWrite: boolean
}
