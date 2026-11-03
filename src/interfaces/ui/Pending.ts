import type { ConfirmOptions } from '@/interfaces/state/ConfirmOptions'
import type { PromptOptions } from '@/interfaces/state/PromptOptions'

export type Pending =
  | { kind: 'confirm'; options: ConfirmOptions; resolve: (value: boolean) => void }
  | { kind: 'prompt'; options: PromptOptions; resolve: (value: string | null) => void }
  | { kind: 'notice'; message: string; resolve: () => void }
