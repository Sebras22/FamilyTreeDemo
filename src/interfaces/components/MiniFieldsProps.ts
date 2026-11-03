import type { Mini } from '@/interfaces/components/Mini'

export interface MiniFieldsProps {
  value: Mini
  onChange: (m: Mini) => void
  label: string
}
