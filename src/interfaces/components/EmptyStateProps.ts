import type { ReactNode } from 'react'
import type { IllustrationKind } from '@/interfaces/ui/IllustrationKind'

export interface EmptyStateProps {
  kind: IllustrationKind
  title: string
  text?: string
  children?: ReactNode
}
