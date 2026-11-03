import { ActionIcon, Button, Textarea } from '@mantine/core'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api, ApiError } from '@/shared/api/api'
import { useI18n } from '@/shared/i18n/i18n'
import type { CommentItem } from '@/interfaces/api/CommentItem'
import type { CommentsProps } from '@/interfaces/components/CommentsProps'

export default function Comments({ person, canWrite }: CommentsProps) {
  const { t, lang } = useI18n()
  const [items, setItems] = useState<CommentItem[]>([])
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fail = useCallback((err: unknown) => setError(err instanceof ApiError ? err.message : t('common.error')), [t])

  const load = useCallback(async () => {
    try {
      setItems(await api.comments(person.id))
    } catch {
      setItems([])
    }
  }, [person.id])

  useEffect(() => {
    load()
  }, [load])

  const add = async (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    try {
      await api.addComment(person.id, text.trim())
      setText('')
      await load()
    } catch (err) {
      fail(err)
    }
  }

  const remove = async (id: number) => {
    try {
      await api.deleteComment(person.id, id)
      await load()
    } catch (err) {
      fail(err)
    }
  }

  return (
    <section>
      <h3>{t('panel.comments')}</h3>
      {error && <div className="error">{error}</div>}
      {items.length === 0 && <p className="muted">{t('panel.noComments')}</p>}
      <ul className="comments">
        {items.map((c) => (
          <li key={c.id}>
            <div className="muted small">
              {c.authorName ?? t('panel.deletedUser')} · {new Date(c.createdAt).toLocaleString(lang)}
              {(c.mine || canWrite) && (
                <ActionIcon variant="subtle" color="red" size="lg" title={t('common.delete')} onClick={() => remove(c.id)}>
                  ×
                </ActionIcon>
              )}
            </div>
            <p>{c.content}</p>
          </li>
        ))}
      </ul>
      {canWrite && (
        <form className="stack tight" onSubmit={add}>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={2000} placeholder={t('panel.commentPlaceholder')} />
          <Button variant="default" type="submit" disabled={!text.trim()}>
            {t('panel.addComment')}
          </Button>
        </form>
      )}
    </section>
  )
}
