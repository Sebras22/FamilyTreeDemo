export interface WizardProps {
  treeId: number
  onDone: (personId: number) => Promise<void> | void
  onClose: () => void
}
