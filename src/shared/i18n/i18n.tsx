import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { en, fr } from './locales'
import type { ChildrenProps } from '@/interfaces/components/ChildrenProps'
import type { I18nState } from '@/interfaces/state/I18nState'
import type { Lang } from '@/interfaces/i18n/Lang'

const dictionaries: Record<Lang, Record<string, string>> = { fr, en }

const I18nContext = createContext<I18nState>({ lang: 'fr', setLang: () => {}, t: (k) => k })

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem('lang')
    if (saved === 'fr' || saved === 'en') return saved
  } catch {
  }
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'fr'
}

export function I18nProvider({ children }: ChildrenProps) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem('lang', lang)
    } catch {
    }
  }, [lang])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const template = dictionaries[lang][key] ?? dictionaries.fr[key] ?? key
      return params ? template.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`)) : template
    },
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang: setLangState, t }), [lang, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)
