import type { ReactNode } from 'react'

export interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}
