import type { Lang } from '@/interfaces/i18n/Lang'

export interface I18nState {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string, params?: Record<string, string | number>) => string
}
