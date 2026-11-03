import { Link } from 'react-router-dom'
import AppHeader from '@/shared/layout/AppHeader'
import { useI18n } from '@/shared/i18n/i18n'

export default function PrivacyPage() {
  const { t } = useI18n()
  return (
    <>
      <AppHeader />
      <main className="page narrow prose">
        <p>
          <Link to="/">← {t('common.back')}</Link>
        </p>
        <h1>{t('privacy.title')}</h1>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <section key={n}>
            <h2>{t(`privacy.h${n}`)}</h2>
            <p>{t(`privacy.p${n}`)}</p>
          </section>
        ))}
      </main>
    </>
  )
}
