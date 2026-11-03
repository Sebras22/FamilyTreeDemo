import { Button, Tabs } from '@mantine/core'
import { Copy, History, Keyboard, LayoutDashboard, List, Network, Plus, Trash2, WandSparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, ApiError } from '@/shared/api/api'
import { useWarnings } from '../hooks/useWarnings'
import { useWorkspaceKeyboard } from '../hooks/useWorkspaceKeyboard'
import { fullName } from '@/domain/dates'
import { computeVisibleIds } from '@/domain/visibility'
import { useI18n } from '@/shared/i18n/i18n'
import { useDialogs } from '@/shared/ui/Dialogs'
import FanChart from './FanChart'
import { EmptyState } from '@/shared/ui/Illustrations'
import PersonPanel from '@/features/persons/components/PersonPanel'
import TreeCanvas from './TreeCanvas'
import TreeDashboard from './TreeDashboard'
import ContextMenu from './workspace/ContextMenu'
import WorkspaceDialogs from './workspace/WorkspaceDialogs'
import WorkspaceToolbar from './workspace/WorkspaceToolbar'
import type { MenuItem } from '@/interfaces/components/MenuItem'
import type { Person } from '@/interfaces/api/Person'
import type { RelateKind } from '@/interfaces/components/RelateKind'
import type { TreeWorkspaceProps } from '@/interfaces/components/TreeWorkspaceProps'
import type { ViewMode } from '@/interfaces/domain/ViewMode'
import type { WorkspaceDialog } from '@/interfaces/components/WorkspaceDialog'

const LARGE_TREE = 150

export default function TreeWorkspace({ treeId, role, graph, persons, loading, loadingMore, reload, selfId, onSetSelf, primaryAction, tools, personUrl }: TreeWorkspaceProps) {
  const { t } = useI18n()
  const { confirm } = useDialogs()
  const canEdit = role === 'EDITOR' || role === 'OWNER'
  const [tab, setTab] = useState<'tree' | 'overview'>('tree')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [focusId, setFocusId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [depth, setDepth] = useState(3)
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())
  const [showRelations, setShowRelations] = useState(false)
  const [centerOn, setCenterOn] = useState<{ id: number; nonce: number } | null>(null)
  const [dialog, setDialog] = useState<WorkspaceDialog>(null)
  const [multiIds, setMultiIds] = useState<number[]>([])
  const [clearNonce, setClearNonce] = useState(0)
  const [contextMenu, setContextMenu] = useState<{ id: number; x: number; y: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const initialised = useRef(false)

  const { warnings, setConfirmed } = useWarnings(graph, treeId)

  useEffect(() => {
    if (initialised.current || persons.length === 0) return
    initialised.current = true
    if (persons.length > LARGE_TREE) {
      setFocusId(selfId != null && persons.some((p) => p.id === selfId) ? selfId : persons[0].id)
      setViewMode('focus')
    }
  }, [persons, selfId])

  const visibleIds = useMemo(() => computeVisibleIds(graph, viewMode, focusId, depth, collapsed), [graph, viewMode, focusId, depth, collapsed])

  const selected = selectedId != null ? graph.persons.get(selectedId) ?? null : null

  const center = useCallback((id: number) => setCenterOn((c) => ({ id, nonce: (c?.nonce ?? 0) + 1 })), [])

  const goTo = useCallback(
    (id: number) => {
      setSelectedId(id)
      if (viewMode === 'focus' && !visibleIds.has(id)) setFocusId(id)
      else center(id)
    },
    [viewMode, visibleIds, center],
  )

  const focusOn = useCallback((id: number) => {
    setFocusId(id)
    setSelectedId(id)
    setViewMode((m) => (m === 'fan' ? 'fan' : 'focus'))
  }, [])

  const toggleCollapse = useCallback((id: number) => {
    setCollapsed((c) => {
      const next = new Set(c)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => setClearNonce((n) => n + 1), [])
  const closeDialog = useCallback(() => setDialog(null), [])
  const closeContextMenu = useCallback(() => setContextMenu(null), [])
  const openHelp = useCallback(() => setDialog({ kind: 'shortcuts' }), [])
  const escape = useCallback(() => {
    setSelectedId(null)
    clearSelection()
  }, [clearSelection])

  const failWith = useCallback((e: unknown) => setError(e instanceof ApiError ? e.message : t('common.error')), [t])

  const onSaved = async (person: Person) => {
    setDialog(null)
    await reload()
    setSelectedId(person.id)
    center(person.id)
  }

  const onWizardDone = async (id: number) => {
    setDialog(null)
    await reload()
    setSelectedId(id)
  }

  const onDelete = useCallback(
    async (person: Person) => {
      const ok = await confirm({
        title: t('panel.delete'),
        message: t('panel.deleteConfirm', { name: fullName(person) }),
        confirmLabel: t('common.delete'),
        danger: true,
      })
      if (!ok) return
      try {
        await api.deletePerson(person.id)
        setSelectedId(null)
        if (focusId === person.id) setFocusId(null)
        await reload()
      } catch (e) {
        failWith(e)
      }
    },
    [confirm, t, focusId, reload, failWith],
  )

  const deleteMany = useCallback(
    async (ids: number[]) => {
      if (treeId == null || ids.length === 0) return
      const ok = await confirm({
        title: t('panel.delete'),
        message: t('list.deleteConfirm', { n: ids.length }),
        confirmLabel: t('common.delete'),
        danger: true,
      })
      if (!ok) return
      try {
        await api.deletePersons(treeId, ids)
        clearSelection()
        setSelectedId(null)
        await reload()
      } catch (e) {
        failWith(e)
      }
    },
    [treeId, confirm, t, reload, failWith, clearSelection],
  )

  const addRelative = useCallback(
    (id: number, kind: RelateKind) => {
      const anchor = graph.persons.get(id)
      if (anchor) setDialog({ kind: 'form', relate: { anchor, kind } })
    },
    [graph],
  )

  useWorkspaceKeyboard({
    active: !dialog && !contextMenu && tab === 'tree',
    selected,
    multiIds,
    graph,
    canEdit,
    goTo,
    focusOn,
    onDelete,
    deleteMany,
    onHelp: openHelp,
    onEscape: escape,
  })

  const changeViewMode = (mode: ViewMode) => {
    if (mode !== 'all' && focusId == null && persons.length) setFocusId(selectedId ?? selfId ?? persons[0].id)
    setViewMode(mode)
  }

  const fitKey = `${treeId}|${persons.length > 0}|${viewMode}|${focusId}|${depth}|${[...collapsed].join(',')}`
  const focusPerson = focusId != null ? graph.persons.get(focusId) : undefined
  const empty = !loading && persons.length === 0
  const fanFocus = focusId ?? selectedId ?? selfId ?? persons[0]?.id ?? null
  const contextPerson = contextMenu ? graph.persons.get(contextMenu.id) : undefined

  const menuItems: MenuItem[] = [
    { key: 'wizard', label: t('toolbar.wizard'), icon: <WandSparkles size={16} />, onClick: () => setDialog({ kind: 'wizard' }), hidden: !canEdit },
    { key: 'list', label: t('toolbar.list'), icon: <List size={16} />, onClick: () => setDialog({ kind: 'list' }), hidden: treeId == null },
    { key: 'dups', label: t('toolbar.duplicates'), icon: <Copy size={16} />, onClick: () => setDialog({ kind: 'duplicates' }), hidden: !canEdit },
    { key: 'trash', label: t('toolbar.trash'), icon: <Trash2 size={16} />, onClick: () => setDialog({ kind: 'trash' }), hidden: !canEdit },
    { key: 'history', label: t('toolbar.history'), icon: <History size={16} />, onClick: () => setDialog({ kind: 'history' }), hidden: !canEdit },
    { key: 'relations', label: t('toolbar.relations'), onClick: () => setShowRelations((v) => !v), checked: showRelations },
    { key: 'expand', label: t('toolbar.expandAll'), onClick: () => setCollapsed(new Set()), hidden: collapsed.size === 0 },
    ...(tools ?? []),
    { key: 'shortcuts', label: t('shortcuts.title'), icon: <Keyboard size={16} />, onClick: openHelp },
  ]

  return (
    <div className="workspace">
      <Tabs value={tab} onChange={(v) => v && setTab(v as 'tree' | 'overview')}>
        <Tabs.List>
          <Tabs.Tab value="tree" leftSection={<Network size={16} />}>
            {t('tabs.tree')}
          </Tabs.Tab>
          <Tabs.Tab value="overview" leftSection={<LayoutDashboard size={16} />}>
            {t('tabs.overview')}
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {tab === 'overview' && !loading ? (
        <TreeDashboard
          graph={graph}
          warnings={warnings}
          treeId={treeId}
          role={role}
          onOpenPerson={(id) => {
            setTab('tree')
            goTo(id)
          }}
        />
      ) : (
        <>
          <WorkspaceToolbar
            persons={persons}
            viewMode={viewMode}
            depth={depth}
            focusPerson={focusPerson}
            canFocusSelf={selfId != null && graph.persons.has(selfId)}
            canEdit={canEdit}
            primaryAction={primaryAction}
            menuItems={menuItems}
            onPick={goTo}
            onViewModeChange={changeViewMode}
            onDepthChange={setDepth}
            onFocusSelf={() => selfId != null && focusOn(selfId)}
            onAddPerson={() => setDialog({ kind: 'form' })}
          />

          {error && <div className="error">{error}</div>}
          {loadingMore && <div className="progress">{t('toolbar.loadingMore', { n: persons.length })}</div>}

          <div className={`stage${selected ? ' with-panel' : ''}`}>
            {loading ? (
              <p className="muted pad">{t('common.loading')}</p>
            ) : empty ? (
              <div className="empty-state">
                <EmptyState kind="tree" title={t('tree.emptyTitle')} text={t('tree.empty')}>
                  {canEdit && (
                    <div className="row center-row">
                      <Button onClick={() => setDialog({ kind: 'wizard' })}>
                        <WandSparkles size={16} /> {t('toolbar.wizard')}
                      </Button>
                      <Button variant="default" onClick={() => setDialog({ kind: 'form' })}>
                        <Plus size={16} /> {t('toolbar.addPerson')}
                      </Button>
                    </div>
                  )}
                </EmptyState>
              </div>
            ) : viewMode === 'fan' && fanFocus != null ? (
              <FanChart
                graph={graph}
                focusId={fanFocus}
                generations={depth === 0 ? 6 : depth}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onFocus={focusOn}
              />
            ) : (
              <TreeCanvas
                storageKey={treeId}
                graph={graph}
                visibleIds={visibleIds}
                warnings={warnings}
                onConfirmWarning={setConfirmed}
                selectedId={selectedId}
                focusId={focusId}
                centerOn={centerOn}
                fitKey={fitKey}
                collapsed={collapsed}
                showRelations={showRelations}
                canEdit={canEdit}
                onMultiChange={setMultiIds}
                clearNonce={clearNonce}
                onSelect={setSelectedId}
                onFocus={focusOn}
                onToggleCollapse={toggleCollapse}
                onAdd={addRelative}
                onContext={(id, x, y) => {
                  setSelectedId(id)
                  setContextMenu({ id, x, y })
                }}
              />
            )}

            {multiIds.length >= 2 && (
              <div className="selection-bar" role="status">
                <strong>{t('selection.count', { n: multiIds.length })}</strong>
                <Button variant="subtle" color="gray" onClick={clearSelection}>
                  {t('selection.clear')}
                </Button>
                {canEdit && (
                  <Button color="red" onClick={() => deleteMany(multiIds)}>
                    {t('common.delete')}
                  </Button>
                )}
              </div>
            )}

            {selected && (
              <PersonPanel
                treeId={treeId}
                person={selected}
                graph={graph}
                warnings={warnings.get(selected.id) ?? []}
                onConfirmWarning={setConfirmed}
                focusId={focusId}
                role={role}
                selfId={selfId ?? null}
                onSetSelf={onSetSelf}
                personUrl={personUrl}
                onClose={() => setSelectedId(null)}
                onEdit={(person) => setDialog({ kind: 'form', person })}
                onAdd={(person, kind) => setDialog({ kind: 'form', relate: { anchor: person, kind } })}
                onDelete={onDelete}
                onFocus={focusOn}
                onSelect={goTo}
                onChanged={reload}
              />
            )}
          </div>
        </>
      )}

      {contextMenu && contextPerson && (
        <ContextMenu
          person={contextPerson}
          x={contextMenu.x}
          y={contextMenu.y}
          canEdit={canEdit}
          onClose={closeContextMenu}
          onFocus={focusOn}
          onEdit={(person) => setDialog({ kind: 'form', person })}
          onAdd={addRelative}
          onDelete={onDelete}
        />
      )}

      <WorkspaceDialogs
        dialog={dialog}
        treeId={treeId}
        role={role}
        graph={graph}
        canEdit={canEdit}
        reload={reload}
        onClose={closeDialog}
        onSelect={goTo}
        onSaved={onSaved}
        onWizardDone={onWizardDone}
      />
    </div>
  )
}
