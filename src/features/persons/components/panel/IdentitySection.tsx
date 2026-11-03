import { formatDate, hasDate } from '@/domain/dates'
import { useI18n } from '@/shared/i18n/i18n'
import type { IdentitySectionProps } from '@/interfaces/components/IdentitySectionProps'

export default function IdentitySection({ person }: IdentitySectionProps) {
  const { t, lang } = useI18n()
  const birthLine = [formatDate(person.birth, lang), person.birthPlace].filter(Boolean).join(' — ')
  const deathLine = [formatDate(person.death, lang), person.deathPlace].filter(Boolean).join(' — ')

  return (
    <section>
      <h3>{t('panel.identity')}</h3>
      <dl>
        {person.middleNames && <><dt>{t('form.middleNames')}</dt><dd>{person.middleNames}</dd></>}
        {person.birthName && <><dt>{t('form.birthName')}</dt><dd>{person.birthName}</dd></>}
        {person.nickname && <><dt>{t('form.nickname')}</dt><dd>{person.nickname}</dd></>}
        <dt>{t('form.sex')}</dt>
        <dd>{t(`sex.${person.sex}`)}</dd>
        {person.birthKind !== 'LIVE' && <><dt>{t('form.birthKind')}</dt><dd>{t(`birthKind.${person.birthKind}`)}</dd></>}
        {birthLine && <><dt>{t('form.birth')}</dt><dd>{birthLine}</dd></>}
        {deathLine && <><dt>{t('form.death')}</dt><dd>{deathLine}</dd></>}
        {!hasDate(person.death) && person.deceased && <><dt>{t('form.death')}</dt><dd>{t('panel.deceasedUnknown')}</dd></>}
        {person.occupation && <><dt>{t('form.occupation')}</dt><dd>{person.occupation}</dd></>}
        {person.twinGroup && <><dt>{t('form.twinGroup')}</dt><dd>{person.twinGroup}</dd></>}
      </dl>
      {person.biography && <p className="bio">{person.biography}</p>}
      {person.source && (
        <p className="muted">
          {t('form.source')} : {person.source}
          {person.sourceReliability && ` (${t(`reliability.${person.sourceReliability}`)})`}
        </p>
      )}
    </section>
  )
}
