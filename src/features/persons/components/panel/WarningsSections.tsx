import { Button } from '@mantine/core'
import { nameOf } from '@/domain/graph'
import { useI18n } from '@/shared/i18n/i18n'
import type { Warning } from '@/interfaces/domain/Warning'
import type { WarningsSectionsProps } from '@/interfaces/components/WarningsSectionsProps'


export default function WarningsSections({ warnings, graph, onConfirmWarning }: WarningsSectionsProps) {
  const { t } = useI18n()
  const errors = warnings.filter((w) => w.severity === 'error')
  const doubts = warnings.filter((w) => w.severity === 'doubt')
  const message = (w: Warning) => t(`warn.${w.code}`, { ...w.params, other: w.otherId != null ? nameOf(graph, w.otherId) : '' })

  return (
    <>
      {errors.length > 0 && (
        <section className="warnings">
          <h3>{t('panel.warnings')}</h3>
          <ul>
            {errors.map((w, i) => (
              <li key={i}>{message(w)}</li>
            ))}
          </ul>
        </section>
      )}

      {doubts.length > 0 && (
        <section className="warnings doubt">
          <h3>{t('panel.doubts')}</h3>
          <ul>
            {doubts.map((w, i) => (
              <li key={i}>
                {message(w)}
                <div className="doubt-actions">
                  {w.confirmed ? (
                    <>
                      <span className="muted small">{t('warn.confirmed')}</span>
                      <Button size="compact-xs" variant="subtle" color="gray" onClick={() => onConfirmWarning(w, false)}>{t('warn.revoke')}</Button>
                    </>
                  ) : (
                    <>
                      <span className="small">{t('warn.confirmQuestion')}</span>
                      <Button size="compact-xs" color="orange" onClick={() => onConfirmWarning(w, true)}>{t('warn.confirmYes')}</Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
