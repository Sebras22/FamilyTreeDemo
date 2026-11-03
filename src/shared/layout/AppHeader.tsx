import { Link } from 'react-router-dom'
import { BRAND_NAME, Logo } from '@/shared/theme/design'
import { useI18n } from '@/shared/i18n/i18n'
import HeaderControls from './HeaderControls'
import type { AppHeaderProps } from '@/interfaces/components/AppHeaderProps'

export default function AppHeader({ children }: AppHeaderProps) {
  const { t } = useI18n()

  return (
    <header className="app-header">
      <Link to="/" className="brand">
        <Logo size={26} /> <span>{BRAND_NAME}</span>
      </Link>
      <div className="header-extra">{children}</div>
      <div className="header-actions">
        <HeaderControls />
        <span className="chip" title={t('demo.banner')}>{t('demo.badge')}</span>
      </div>
    </header>
  )
}
