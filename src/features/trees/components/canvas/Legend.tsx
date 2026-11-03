import { Button } from '@mantine/core'
import { Info } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '@/shared/i18n/i18n'
import { TombstoneIcon } from '@/shared/ui/Icons'

export function Legend() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  return (
    <div className="legend">
      <Button variant="subtle" color="gray" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Info size={16} /> {t('legend.title')}
      </Button>
      {open && (
        <ul>
          <li><span className="swatch-bar male" /> {t('sex.MALE')}</li>
          <li><span className="swatch-bar female" /> {t('sex.FEMALE')}</li>
          <li><TombstoneIcon /> {t('legend.deceased')}</li>
          <li><span className="swatch-box floating" /> {t('legend.floating')}</li>
          <li><span className="swatch-box warning" /> {t('legend.warning')}</li>
          <li><span className="swatch-box doubt" /> {t('legend.doubt')}</li>
          <li><span className="swatch-line" /> {t('legend.union')}</li>
        </ul>
      )}
    </div>
  )
}
