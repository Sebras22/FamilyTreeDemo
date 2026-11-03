import { Button, NativeSelect } from '@mantine/core'
import { Ellipsis, Locate, Plus } from 'lucide-react'
import { fullName } from '@/domain/dates'
import PersonPicker from '@/features/persons/components/PersonPicker'
import { useI18n } from '@/shared/i18n/i18n'
import Menu from '@/shared/ui/Menu'
import type { ViewMode } from '@/interfaces/domain/ViewMode'
import type { WorkspaceToolbarProps } from '@/interfaces/components/WorkspaceToolbarProps'

const DEPTHS = [1, 2, 3, 4, 5, 6]

export default function WorkspaceToolbar({
  persons,
  viewMode,
  depth,
  focusPerson,
  canFocusSelf,
  canEdit,
  primaryAction,
  menuItems,
  onPick,
  onViewModeChange,
  onDepthChange,
  onFocusSelf,
  onAddPerson,
}: WorkspaceToolbarProps) {
  const { t } = useI18n()
  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <PersonPicker persons={persons} placeholder={t('toolbar.search')} onPick={(p) => onPick(p.id)} />
      </div>
      <div className="toolbar-group">
        <NativeSelect size="xs" value={viewMode} onChange={(e) => onViewModeChange(e.target.value as ViewMode)} aria-label={t('toolbar.view')}>
          <option value="all">{t('toolbar.viewAll')}</option>
          <option value="focus">{t('toolbar.viewFocus')}</option>
          <option value="fan">{t('toolbar.viewFan')}</option>
        </NativeSelect>
        {viewMode !== 'all' && (
          <NativeSelect size="xs" value={depth} onChange={(e) => onDepthChange(Number(e.target.value))} aria-label={t('toolbar.depth')}>
            {DEPTHS.map((d) => (
              <option key={d} value={d}>
                {t('toolbar.generations', { n: d })}
              </option>
            ))}
            {viewMode === 'focus' && <option value={0}>{t('toolbar.unlimited')}</option>}
          </NativeSelect>
        )}
        {focusPerson && viewMode !== 'all' && <span className="chip" title={t('toolbar.focus')}>{fullName(focusPerson)}</span>}
        {canFocusSelf && (
          <Button variant="subtle" color="gray" onClick={onFocusSelf} title={t('toolbar.me')}>
            <Locate size={16} /> {t('toolbar.me')}
          </Button>
        )}
      </div>
      <div className="toolbar-group">
        {canEdit && (
          <Button onClick={onAddPerson}>
            <Plus size={16} /> {t('toolbar.addPerson')}
          </Button>
        )}
        {primaryAction}
        <Menu label={t('toolbar.more')} icon={<Ellipsis size={16} />} items={menuItems} />
      </div>
    </div>
  )
}
