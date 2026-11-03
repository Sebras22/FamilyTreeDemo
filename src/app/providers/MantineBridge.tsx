import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { mantineTheme } from '@/shared/theme/mantineTheme'
import { useTheme } from '@/shared/theme/theme'
import type { ChildrenProps } from '@/interfaces/components/ChildrenProps'

export default function MantineBridge({ children }: ChildrenProps) {
  const { theme } = useTheme()
  return (
    <MantineProvider theme={mantineTheme} forceColorScheme={theme}>
      <Notifications />
      {children}
    </MantineProvider>
  )
}
