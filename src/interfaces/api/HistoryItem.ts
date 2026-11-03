export interface HistoryItem {
  id: number
  entityType: string
  entityId: number | null
  action: string
  label: string | null
  userName: string | null
  createdAt: string
}
