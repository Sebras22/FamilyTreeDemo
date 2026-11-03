import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '@/shared/api/api'
import type { AuthState } from '@/interfaces/state/AuthState'
import type { ChildrenProps } from '@/interfaces/components/ChildrenProps'
import type { User } from '@/interfaces/api/User'

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: ChildrenProps) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    api.me().then(setUser)
  }, [])

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}
