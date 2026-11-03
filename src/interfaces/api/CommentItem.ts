export interface CommentItem {
  id: number
  personId: number
  authorName: string | null
  mine: boolean
  content: string
  createdAt: string
}
