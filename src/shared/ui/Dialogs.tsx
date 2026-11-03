import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core'
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { useI18n } from '@/shared/i18n/i18n'
import type { ChildrenProps } from '@/interfaces/components/ChildrenProps'
import type { DialogViewProps } from '@/interfaces/components/DialogViewProps'
import type { DialogsApi } from '@/interfaces/state/DialogsApi'
import type { Pending } from '@/interfaces/ui/Pending'

const DialogsContext = createContext<DialogsApi | null>(null)

export function DialogsProvider({ children }: ChildrenProps) {
  const [pending, setPending] = useState<Pending | null>(null)

  const api = useMemo<DialogsApi>(
    () => ({
      confirm: (options) =>
        new Promise((resolve) => setPending({ kind: 'confirm', options: typeof options === 'string' ? { message: options } : options, resolve })),
      prompt: (options) => new Promise((resolve) => setPending({ kind: 'prompt', options, resolve })),
      notice: (message) => new Promise((resolve) => setPending({ kind: 'notice', message, resolve })),
    }),
    [],
  )

  const close = useCallback(() => setPending(null), [])

  return (
    <DialogsContext.Provider value={api}>
      {children}
      {pending && <DialogView pending={pending} onClose={close} />}
    </DialogsContext.Provider>
  )
}

function DialogView({ pending, onClose }: DialogViewProps) {
  const { t } = useI18n()
  const [value, setValue] = useState(pending.kind === 'prompt' ? (pending.options.defaultValue ?? '') : '')
  const settled = useRef(false)

  const finish = (result: boolean | string | null) => {
    if (settled.current) return
    settled.current = true
    if (pending.kind === 'confirm') pending.resolve(result === true)
    else if (pending.kind === 'prompt') pending.resolve(typeof result === 'string' ? result : null)
    else pending.resolve()
    onClose()
  }
  const dismiss = () => finish(pending.kind === 'prompt' ? null : false)

  const title =
    pending.kind === 'confirm' ? (pending.options.title ?? t('dialog.confirmTitle')) : pending.kind === 'prompt' ? pending.options.title : t('dialog.noticeTitle')
  const danger = pending.kind === 'confirm' && pending.options.danger

  return (
    <Modal opened onClose={dismiss} title={title} size={420} centered zIndex={200} role="alertdialog" transitionProps={{ transition: 'pop', duration: 150 }}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          finish(pending.kind === 'prompt' ? value.trim() || null : true)
        }}
      >
        <Stack gap="md">
          {pending.kind === 'confirm' && <Text>{pending.options.message}</Text>}
          {pending.kind === 'notice' && <Text>{pending.message}</Text>}
          {pending.kind === 'prompt' && (
            <TextInput label={pending.options.label} value={value} onChange={(e) => setValue(e.currentTarget.value)} data-autofocus />
          )}
          <Group justify="flex-end" gap="xs">
            {pending.kind !== 'notice' && (
              <Button variant="default" onClick={dismiss}>
                {t('common.cancel')}
              </Button>
            )}
            <Button type="submit" color={danger ? 'red' : undefined} data-autofocus={pending.kind !== 'prompt' || undefined}>
              {pending.kind === 'confirm' ? (pending.options.confirmLabel ?? t('common.confirm')) : pending.kind === 'prompt' ? (pending.options.confirmLabel ?? t('common.save')) : t('common.ok')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export function useDialogs(): DialogsApi {
  const ctx = useContext(DialogsContext)
  if (!ctx) throw new Error('useDialogs doit être utilisé dans DialogsProvider')
  return ctx
}
