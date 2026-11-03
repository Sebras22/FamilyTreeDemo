import { Button } from '@mantine/core'
import { useRef } from 'react'
import { invalidatePhoto } from '@/features/persons/hooks/photos'
import { api } from '@/shared/api/api'
import { useI18n } from '@/shared/i18n/i18n'
import type { PhotoSectionProps } from '@/interfaces/components/PhotoSectionProps'

export default function PhotoSection({ person, run }: PhotoSectionProps) {
  const { t } = useI18n()
  const fileInput = useRef<HTMLInputElement>(null)

  return (
    <section>
      <h3>{t('panel.photo')}</h3>
      <div className="row wrap">
        <Button variant="default" onClick={() => fileInput.current?.click()}>{person.hasPhoto ? t('panel.changePhoto') : t('panel.addPhoto')}</Button>
        {person.hasPhoto && (
          <Button
            variant="subtle"
            color="red"
            onClick={() =>
              run(async () => {
                await api.deletePhoto(person.id)
                invalidatePhoto(person.id)
              })
            }
          >
            {t('common.delete')}
          </Button>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/gif"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file)
              run(async () => {
                await api.uploadPhoto(person.id, file)
                invalidatePhoto(person.id)
              })
          }}
        />
      </div>
      <small className="muted">{t('panel.photoHint')}</small>
    </section>
  )
}
