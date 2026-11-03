import type { Person } from '@/interfaces/api/Person'
import type { RelateKind } from '@/interfaces/components/RelateKind'
import type { Graph } from '@/interfaces/domain/Graph'

export interface PersonFormProps {
  treeId: number
  graph: Graph
  person?: Person
  relate?: { anchor: Person; kind: RelateKind }
  onClose: () => void
  onSaved: (person: Person) => void
}
