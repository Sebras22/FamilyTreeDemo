import type { GoogleId } from '@/interfaces/window/GoogleId'

declare global {
  interface Window {
    google?: GoogleId
  }
}
