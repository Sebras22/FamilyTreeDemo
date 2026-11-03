import type { Person } from '@/interfaces/api/Person'
import type { RelateKind } from '@/interfaces/components/RelateKind'

export type WorkspaceDialog =
  | { kind: 'form'; person?: Person; relate?: { anchor: Person; kind: RelateKind } }
  | { kind: 'list' }
  | { kind: 'duplicates' }
  | { kind: 'trash' }
  | { kind: 'history' }
  | { kind: 'wizard' }
  | { kind: 'shortcuts' }
  | null
