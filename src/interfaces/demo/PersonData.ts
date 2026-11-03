import type { PersonRecord } from '@/interfaces/demo/PersonRecord'

export type PersonData = Omit<PersonRecord, 'id' | 'treeId' | 'deletedAt' | 'photo'>
