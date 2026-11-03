export interface MultiSelectionOptions {
  selectedId: number | null
  clearNonce: number
  onMultiChange: (ids: number[]) => void
  onSelect: (id: number | null) => void
}
