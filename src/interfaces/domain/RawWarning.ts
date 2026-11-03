import type { Warning } from '@/interfaces/domain/Warning'

export type RawWarning = Omit<Warning, 'severity' | 'confirmed'>
