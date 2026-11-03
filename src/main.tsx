import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/mukta-mahee/400.css'
import '@fontsource/mukta-mahee/500.css'
import '@fontsource/mukta-mahee/600.css'
import '@fontsource/mukta-mahee/700.css'
import '@fontsource/mukta-mahee/800.css'
import '@mantine/core/styles.layer.css'
import '@mantine/notifications/styles.layer.css'
import '@mantine/dates/styles.layer.css'
import '@/styles/index.css'
import App from '@/app/App'
import AppProviders from '@/app/providers/AppProviders'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
