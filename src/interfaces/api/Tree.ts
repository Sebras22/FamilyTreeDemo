import type { Role } from '@/interfaces/api/Role'

export interface Tree {
  id: number
  name: string
  role: Role
  personCount: number
  selfPersonId: number | null
}
