import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '@/shared/api/api'
import { errorStatus } from '@/shared/api/errorStatus'
import ErrorPage from '@/shared/ui/ErrorPage'
import AppHeader from '@/shared/layout/AppHeader'
import TreeWorkspace from '@/features/trees/components/TreeWorkspace'
import { useDialogs } from '@/shared/ui/Dialogs'
import { useI18n } from '@/shared/i18n/i18n'
import { useTreeData } from '@/features/trees/hooks/useTreeData'
import type { Tree } from '@/interfaces/api/Tree'

export default function TreePage() {
  const { treeId: param } = useParams()
  const treeId = Number(param)
  const { t } = useI18n()
  const { notice } = useDialogs()
  const [tree, setTree] = useState<Tree | null>(null)
  const [failure, setFailure] = useState<number | null>(null)
  const data = useTreeData(Number.isFinite(treeId) ? treeId : null)

  useEffect(() => {
    api
      .listTrees()
      .then((trees) => {
        const found = trees.find((x) => x.id === treeId)
        if (found) setTree(found)
        else setFailure(404)
      })
      .catch((e) => setFailure(errorStatus(e)))
  }, [treeId])

  if (failure != null) {
    return (
      <>
        <AppHeader />
        <ErrorPage status={failure} text={failure === 404 ? t('tree.notFound') : undefined} />
      </>
    )
  }

  return (
    <div className="tree-page">
      <AppHeader>
        {tree && (
          <div className="tree-title">
            <Link to="/" className="muted">
              {t('trees.title')}
            </Link>
            <span className="muted"> / </span>
            <strong>{tree.name}</strong>
            <span className="chip">{t(`role.${tree.role}`)}</span>
          </div>
        )}
      </AppHeader>
      {tree && (
        <TreeWorkspace
          treeId={tree.id}
          role={tree.role}
          graph={data.graph}
          persons={data.persons}
          loading={data.loading}
          loadingMore={data.loadingMore}
          reload={data.reload}
          selfId={tree.selfPersonId}
          onSetSelf={async (personId) => setTree(await api.setSelf(tree.id, personId))}
          personUrl={(id) => `/trees/${tree.id}/persons/${id}`}
          tools={[
            {
              key: 'gedcom',
              label: t('toolbar.exportGedcom'),
              icon: <Download size={16} />,
              onClick: () => api.exportGedcom(tree.id, tree.name).catch(() => notice(t('common.error'))),
            },
          ]}
        />
      )}
    </div>
  )
}
