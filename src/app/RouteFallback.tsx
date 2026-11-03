import { useI18n } from '@/shared/i18n/i18n'

export default function RouteFallback() {
  const { t } = useI18n()
  return (
    <p className="muted pad" role="status">
      {t('common.loading')}
    </p>
  )
}
