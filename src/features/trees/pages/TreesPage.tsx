import { ActionIcon, Button, TextInput } from '@mantine/core'
import { Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '@/shared/api/api'
import { useAuth } from '@/shared/auth/AuthContext'
import AppHeader from '@/shared/layout/AppHeader'
import { Illustration } from '@/shared/ui/Illustrations'
import { useDialogs } from '@/shared/ui/Dialogs'
import { useI18n } from '@/shared/i18n/i18n'
import type { IllustrationKind } from '@/interfaces/ui/IllustrationKind'
import type { Tree } from '@/interfaces/api/Tree'

const COVERS = ['golden', 'silhouette', 'album', 'generations', 'baby']

export default function TreesPage() {
  const { t } = useI18n()
  const { confirm, prompt } = useDialogs()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [trees, setTrees] = useState<Tree[] | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    try {
      setTrees(await api.listTrees())
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('common.error'))
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  const run = async (fn: () => Promise<void>) => {
    setError(null)
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  const create = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    run(async () => {
      const tree = await api.createTree(name.trim())
      navigate(`/trees/${tree.id}`)
    })
  }

  const importFile = (file: File) =>
    run(async () => {
      const result = await api.importGedcom(file, file.name.replace(/\.ged$/i, ''))
      navigate(`/trees/${result.treeId}`)
    })

  const rename = async (tree: Tree) => {
    const next = await prompt({ title: t('common.rename'), label: t('trees.renamePrompt'), defaultValue: tree.name })
    if (!next || next === tree.name) return
    run(async () => {
      await api.renameTree(tree.id, next)
      await load()
    })
  }

  const remove = async (tree: Tree) => {
    if (!(await confirm({ title: t('common.delete'), message: t('trees.deleteConfirm', { name: tree.name }), confirmLabel: t('common.delete'), danger: true }))) return
    run(async () => {
      await api.deleteTree(tree.id)
      await load()
    })
  }

  const totalPersons = trees?.reduce((sum, tree) => sum + tree.personCount, 0) ?? 0

  return (
    <>
      <AppHeader />
      <main className="page wide">
        <div className="notice">{t('demo.banner')}</div>
        <section className="hero-banner">
          <div>
            <p className="eyebrow">{t('trees.title')}</p>
            <h1>{t('trees.hello', { name: user?.displayName.split(' ')[0] ?? '' })}</h1>
            <p className="muted">{t('trees.subtitle')}</p>
          </div>
          {trees && trees.length > 0 && (
            <div className="stats">
              <div>
                <strong>{trees.length}</strong>
                <span>{t('trees.statTrees')}</span>
              </div>
              <div>
                <strong>{totalPersons}</strong>
                <span>{t('trees.statPersons')}</span>
              </div>
            </div>
          )}
        </section>

        {error && <div className="error">{error}</div>}

        <form className="create-bar" onSubmit={create}>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder={t('trees.newName')} maxLength={255} />
          <Button type="submit" disabled={busy || !name.trim()}>
            <Plus size={16} /> {t('trees.create')}
          </Button>
          <Button variant="default" type="button" onClick={() => fileInput.current?.click()} disabled={busy}>
            <Upload size={16} /> {t('trees.import')}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".ged,.gedcom,text/plain"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) importFile(file)
            }}
          />
        </form>

        {trees === null ? (
          <p className="muted">{t('common.loading')}</p>
        ) : trees.length === 0 ? (
          <div className="empty-hero" style={{ backgroundImage: 'url(/images/album.jpg)' }}>
            <div className="hero-shade" />
            <p>{t('trees.empty')}</p>
          </div>
        ) : (
          <ul className="cover-grid">
            {trees.map((tree, i) => (
              <motion.li
                key={tree.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
              >
                <Link
                  to={`/trees/${tree.id}`}
                  className="cover"
                  style={{ backgroundImage: `url(/images/${COVERS[tree.id % COVERS.length]}.jpg)` }}
                >
                  <div className="hero-shade" />
                  <div className="cover-text">
                    <span className="chip">{t(`role.${tree.role}`)}</span>
                    <strong>{tree.name}</strong>
                    <span>{t('trees.persons', { n: tree.personCount })}</span>
                  </div>
                </Link>
                {tree.role === 'OWNER' && (
                  <div className="cover-actions">
                    <ActionIcon variant="subtle" color="gray" size="lg" onClick={() => rename(tree)} title={t('common.rename')} aria-label={t('common.rename')}>
                      <Pencil size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="gray" size="lg" onClick={() => remove(tree)} title={t('common.delete')} aria-label={t('common.delete')}>
                      <Trash2 size={16} />
                    </ActionIcon>
                  </div>
                )}
              </motion.li>
            ))}
          </ul>
        )}

        <section className="tips">
          <h2>{t('tips.title')}</h2>
          <div className="tips-grid">
            {(
              [
                { kind: 'import', key: 'import' },
                { kind: 'album', key: 'photos' },
              ] as { kind: IllustrationKind; key: string }[]
            ).map((tip, i) => (
              <motion.article
                key={tip.key}
                className="tip"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
              >
                <Illustration kind={tip.kind} />
                <h3>{t(`tips.${tip.key}.title`)}</h3>
                <p className="muted">{t(`tips.${tip.key}.text`)}</p>
                {tip.key === 'import' && (
                  <Button variant="default" onClick={() => fileInput.current?.click()} disabled={busy}>
                    <Upload size={16} /> {t('trees.import')}
                  </Button>
                )}
              </motion.article>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
