import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ChildrenProps } from '@/interfaces/components/ChildrenProps'
import type { Theme } from '@/interfaces/theme/Theme'
import type { ThemeState } from '@/interfaces/state/ThemeState'

const ThemeContext = createContext<ThemeState>({ theme: 'light', toggle: () => {} })

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: ChildrenProps) {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('theme', theme)
    } catch {
    }
  }, [theme])

  const value = useMemo(() => ({ theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }), [theme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
