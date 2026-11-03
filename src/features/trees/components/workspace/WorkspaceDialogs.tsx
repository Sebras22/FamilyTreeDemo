import Wizard from '@/features/onboarding/components/Wizard'
import PersonForm from '@/features/persons/components/PersonForm'
import ListDialog from '@/features/tools/components/ListDialog'
import { DuplicatesDialog, HistoryDialog, TrashDialog } from '@/features/tools/components/ToolDialogs'
import { useI18n } from '@/shared/i18n/i18n'
import Modal from '@/shared/ui/Modal'
import type { ShortcutsDialogProps } from '@/interfaces/components/ShortcutsDialogProps'
import type { WorkspaceDialogsProps } from '@/interfaces/components/WorkspaceDialogsProps'

const SHORTCUTS = ['search', 'arrows', 'enter', 'select', 'delete', 'escape', 'zoom', 'help'] as const

function ShortcutsDialog({ onClose }: ShortcutsDialogProps) {
  const { t } = useI18n()
  return (
    <Modal title={t('shortcuts.title')} onClose={onClose}>
      <dl className="shortcuts">
        {SHORTCUTS.map((k) => (
          <div key={k}>
            <dt>{t(`shortcuts.${k}.keys`)}</dt>
            <dd>{t(`shortcuts.${k}.text`)}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  )
}

export default function WorkspaceDialogs({ dialog, treeId, role, graph, canEdit, reload, onClose, onSelect, onSaved, onWizardDone }: WorkspaceDialogsProps) {
  if (!dialog) return null
  if (dialog.kind === 'shortcuts') return <ShortcutsDialog onClose={onClose} />
  if (treeId == null) return null
  switch (dialog.kind) {
    case 'form':
      return <PersonForm treeId={treeId} graph={graph} person={dialog.person} relate={dialog.relate} onClose={onClose} onSaved={onSaved} />
    case 'list':
      return <ListDialog treeId={treeId} graph={graph} canEdit={canEdit} onChanged={reload} onSelect={onSelect} onClose={onClose} />
    case 'duplicates':
      return <DuplicatesDialog treeId={treeId} graph={graph} onChanged={reload} onClose={onClose} />
    case 'trash':
      return role ? <TrashDialog treeId={treeId} role={role} onChanged={reload} onClose={onClose} /> : null
    case 'history':
      return <HistoryDialog treeId={treeId} onClose={onClose} />
    case 'wizard':
      return <Wizard treeId={treeId} onClose={onClose} onDone={onWizardDone} />
  }
}
