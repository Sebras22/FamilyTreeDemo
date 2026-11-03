import type { ReactNode } from 'react'
import type { MenuItem } from '@/interfaces/components/MenuItem'

export interface MenuProps {
  label: string
  icon?: ReactNode
  items: MenuItem[]
}
