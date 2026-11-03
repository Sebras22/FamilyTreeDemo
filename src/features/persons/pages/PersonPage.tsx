import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '@/shared/api/api'
import AppHeader from '@/shared/layout/AppHeader'
import PersonForm from '@/features/persons/components/PersonForm'
import PersonProfile from '@/features/persons/components/PersonProfile'
import { useI18n } from '@/shared/i18n/i18n'
import { useTreeData } from '@/features/trees/hooks/useTreeData'
import type { Tree } from '@/interfaces/api/Tree'

export function PersonPage() {
  const { treeId: treeParam, personId: personParam } = useParams()
  const treeId = Number(treeParam)
  const personId = Number(personParam)
  const { t } = useI18n()
  const [tree, setTree] = useState<Tree | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const data = useTreeData(Number.isFinite(treeId) ? treeId : null)

  useEffect(() => {
    api
      .listTrees()
      .then((trees) => setTree(trees.find((x) => x.id === treeId) ?? null))
      .catch((e) => setError(e instanceof ApiError ? e.message : t('common.error')))
  }, [treeId, t])

  const person = data.graph.persons.get(personId)

  return (
    <>
      <AppHeader />
      <main className="page wide">
        {error && <div className="error">{error}</div>}
        {data.loading && <p className="muted">{t('common.loading')}</p>}
        {!data.loading && !person && (
          <p>
            {t('profile.notFound')} <Link to={`/trees/${treeId}`}>{t('common.back')}</Link>
          </p>
        )}
        {person && (
          <PersonProfile
            graph={data.graph}
            person={person}
            role={tree?.role ?? null}
            personUrl={(id) => `/trees/${treeId}/persons/${id}`}
            backTo={`/trees/${treeId}`}
            backLabel={tree?.name ?? t('common.back')}
            onEdit={() => setEditing(true)}
          />
        )}
        {editing && person && (
          <PersonForm
            treeId={treeId}
            graph={data.graph}
            person={person}
            onClose={() => setEditing(false)}
            onSaved={async () => {
              setEditing(false)
              await data.reload()
            }}
          />
        )}
      </main>
    </>
  )
}
