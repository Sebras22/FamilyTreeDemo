import type { Person } from '@/interfaces/api/Person'
import type { Role } from '@/interfaces/api/Role'
import type { Graph } from '@/interfaces/domain/Graph'

export interface PersonProfileProps {
  graph: Graph
  person: Person
  role: Role | null
  personUrl: (id: number) => string
  backTo: string
  backLabel: string
  onEdit?: (person: Person) => void
}
