import type { User } from '@/interfaces/api/User'

export interface AuthState {
  user: User | null
}
