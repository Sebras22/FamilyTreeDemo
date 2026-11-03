import type { Theme } from '@/interfaces/theme/Theme'

export interface ThemeState {
  theme: Theme
  toggle: () => void
}
