import { ActionIcon, NativeSelect } from '@mantine/core'
import { Moon, Sun } from 'lucide-react'
import { useI18n } from '@/shared/i18n/i18n'
import { useTheme } from '@/shared/theme/theme'

export default function HeaderControls() {
  const { t, lang, setLang } = useI18n()
  const { theme, toggle } = useTheme()

  return (
    <>
      <NativeSelect value={lang} onChange={(e) => setLang(e.target.value as 'fr' | 'en')} aria-label={t('common.language')} size="xs">
        <option value="fr">FR</option>
        <option value="en">EN</option>
      </NativeSelect>
      <ActionIcon variant="subtle" color="gray" size="lg" onClick={toggle} title={t('common.theme')} aria-label={t('common.theme')}>
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </ActionIcon>
    </>
  )
}
