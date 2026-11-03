import type { ReactNode } from 'react'

export interface MenuItem {
  key: string
  label: string
  icon?: ReactNode
  onClick: () => void
  danger?: boolean
  checked?: boolean
  hidden?: boolean
}
