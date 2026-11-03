import { createTheme, Tabs, type MantineColorsTuple } from '@mantine/core'

const brand = Array.from({ length: 10 }, () => 'var(--primary)') as unknown as MantineColorsTuple

export const mantineTheme = createTheme({
  primaryColor: 'brand',
  primaryShade: 6,
  colors: { brand },
  fontFamily: 'inherit',
  headings: { fontFamily: 'inherit' },
  defaultRadius: 'md',
  cursorType: 'pointer',
  components: {
    Tabs: Tabs.extend({ defaultProps: { variant: 'pills' } }),
  },
})
