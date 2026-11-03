import type { Person } from '@/interfaces/api/Person'

export type PersonRecord = Omit<Person, 'living' | 'floating' | 'hasPhoto'> & { photo: Blob | null }
