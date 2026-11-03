import { useEffect, useId } from 'react'
import { useTheme } from './theme'
import type { LogoProps } from '@/interfaces/components/LogoProps'

export const BRAND_NAME = 'Arbora'

const ACCENT = {
  light: { primary: '#e8445f', text: '#ffffff' },
  dark: { primary: '#ff6b81', text: '#2a0a10' },
}

export function Logo({ size = 28 }: LogoProps) {
  const maskId = `leaf-${useId().replace(/:/g, '')}`
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <mask id={maskId}>
        <rect width="64" height="64" fill="#fff" />
        <path d="M32 50V21M32 44L22.5 35M32 37L41.5 28" stroke="#000" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        <circle cx="32" cy="21" r="2.6" />
        <circle cx="22.5" cy="35" r="2.6" />
        <circle cx="41.5" cy="28" r="2.6" />
      </mask>
      <path d="M32 6C51 15 54 37 32 57C10 37 13 15 32 6Z" fill="currentColor" mask={`url(#${maskId})`} />
      <path d="M32 50V59.3" stroke="currentColor" strokeWidth="3.4" />
      <circle cx="32" cy="59.3" r="1.7" fill="currentColor" />
    </svg>
  )
}

export function useBrandStyling() {
  const { theme } = useTheme()

  useEffect(() => {
    const colors = ACCENT[theme]
    const root = document.documentElement
    root.style.setProperty('--primary', colors.primary)
    root.style.setProperty('--primary-text', colors.text)
    document.title = BRAND_NAME
  }, [theme])
}
