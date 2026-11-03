import type { ConfirmOptions } from '@/interfaces/state/ConfirmOptions'
import type { PromptOptions } from '@/interfaces/state/PromptOptions'

export interface DialogsApi {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>
  prompt: (options: PromptOptions) => Promise<string | null>
  notice: (message: string) => Promise<void>
}
