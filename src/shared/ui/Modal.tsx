import { Modal as MantineModal } from '@mantine/core'
import { useI18n } from '@/shared/i18n/i18n'
import type { ModalProps } from '@/interfaces/components/ModalProps'

export default function Modal({ title, onClose, children, wide }: ModalProps) {
  const { t } = useI18n()

  return (
    <MantineModal
      opened
      onClose={onClose}
      title={title}
      size={wide ? 720 : 480}
      centered={false}
      yOffset="3vh"
      closeButtonProps={{ 'aria-label': t('common.close') }}
      transitionProps={{ transition: 'pop', duration: 180 }}
      classNames={{ content: 'mantine-modal-content', header: 'mantine-modal-header' }}
      styles={{ title: { fontWeight: 700, fontSize: '1.1rem' } }}
    >
      {children}
    </MantineModal>
  )
}
