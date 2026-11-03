import { MotionConfig } from 'motion/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/auth/AuthContext'
import { I18nProvider } from '@/shared/i18n/i18n'
import { ThemeProvider } from '@/shared/theme/theme'
import { DialogsProvider } from '@/shared/ui/Dialogs'
import MantineBridge from './MantineBridge'
import RouteErrorBoundary from './RouteErrorBoundary'
import type { ChildrenProps } from '@/interfaces/components/ChildrenProps'

export default function AppProviders({ children }: ChildrenProps) {
  return (
    <I18nProvider>
      <ThemeProvider>
        <MantineBridge>
          <MotionConfig reducedMotion="user">
            <BrowserRouter>
              <AuthProvider>
                <DialogsProvider>
                  <RouteErrorBoundary>{children}</RouteErrorBoundary>
                </DialogsProvider>
              </AuthProvider>
            </BrowserRouter>
          </MotionConfig>
        </MantineBridge>
      </ThemeProvider>
    </I18nProvider>
  )
}
