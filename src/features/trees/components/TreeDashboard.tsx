import { Anchor, Button } from '@mantine/core'
import { CalendarHeart, Camera, Network, Users } from 'lucide-react'
import { motion } from 'motion/react'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { api } from '@/shared/api/api'
import { warningTone } from '@/domain/consistency'
import { fullName } from '@/domain/dates'
import { computeTreeStats } from '@/domain/stats'
import { useI18n } from '@/shared/i18n/i18n'
import { EmptyState } from '@/shared/ui/Illustrations'
import { Donut, Progress, Ranking } from './dashboard/Charts'
import type { HistoryItem } from '@/interfaces/api/HistoryItem'
import type { TreeDashboardProps } from '@/interfaces/components/TreeDashboardProps'

const FranceMap = lazy(() => import('./FranceMap'))

export default function TreeDashboard({ graph, warnings, treeId, role, onOpenPerson }: TreeDashboardProps) {
  const { t, lang } = useI18n()
  const [activity, setActivity] = useState<HistoryItem[] | null>(null)
  const canEdit = role === 'EDITOR' || role === 'OWNER'

  useEffect(() => {
    if (treeId == null || !canEdit) return
    api.history(treeId).then((h) => setActivity(h.slice(0, 8))).catch(() => setActivity([]))
  }, [treeId, canEdit])

  const stats = useMemo(() => computeTreeStats(graph, warnings, new Date()), [graph, warnings])

  if (stats.persons.length === 0) {
    return (
      <div className="dash">
        <EmptyState kind="chart" title={t('dash.emptyTitle')} text={t('dash.emptyText')} />
      </div>
    )
  }

  const total = stats.persons.length
  const maxDecade = Math.max(1, ...stats.decadeBars.map(([, n]) => n))
  const firstWarning = [...warnings.keys()].find((id) => graph.persons.has(id) && warningTone(warnings.get(id)) != null)
  const rise = (i: number) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05, duration: 0.35 } })

  return (
    <div className="dash">
      <div className="tiles">
        {[
          { icon: <Users size={20} />, value: total, label: t('dash.persons') },
          { icon: <Network size={20} />, value: stats.generations, label: t('dash.generations') },
          { icon: <CalendarHeart size={20} />, value: stats.couples, label: t('dash.couples') },
        ].map((tile, i) => (
          <motion.div key={tile.label} className="tile" {...rise(i)}>
            <span className="tile-icon">{tile.icon}</span>
            <strong>{tile.value}</strong>
            <span className="muted">{tile.label}</span>
          </motion.div>
        ))}
      </div>

      <div className="dash-grid">
        <motion.section className="card span2" {...rise(4)}>
          <h3>{t('dash.births')}</h3>
          {stats.decadeBars.length === 0 ? (
            <p className="muted">{t('dash.noDates')}</p>
          ) : (
            <div className="columns" role="img" aria-label={t('dash.births')}>
              {stats.decadeBars.map(([decade, n]) => (
                <div key={decade} className="column" title={`${decade}s : ${n}`}>
                  <span className="value">{n}</span>
                  <div className="bar" style={{ height: `${Math.max(8, (n / maxDecade) * 100)}%` }} />
                  <span className="label">{decade}</span>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        <motion.section className="card" {...rise(5)}>
          <h3>{t('dash.split')}</h3>
          <Donut
            parts={[
              { value: stats.sex.MALE, className: 'male', label: t('sex.MALE') },
              { value: stats.sex.FEMALE, className: 'female', label: t('sex.FEMALE') },
              { value: stats.sex.UNKNOWN, className: 'other', label: t('sex.UNKNOWN') },
            ]}
          />
          <p className="muted small">
            {t('dash.livingCount', { living: stats.living, deceased: total - stats.living })}
          </p>
        </motion.section>

        <motion.section className="card" {...rise(6)}>
          <h3>{t('dash.surnames')}</h3>
          <Ranking items={stats.surnames} />
        </motion.section>

        <motion.section className="card span2" {...rise(7)}>
          <h3>{t('dash.places')}</h3>
          {stats.places.length === 0 ? (
            <p className="muted">{t('dash.noPlaces')}</p>
          ) : (
            <div className="places-layout">
              <Suspense fallback={<p className="muted">{t('common.loading')}</p>}>
                <FranceMap places={stats.birthPlaces} />
              </Suspense>
              <Ranking items={stats.places} />
            </div>
          )}
        </motion.section>

        {stats.oldest && (
          <motion.section className="card highlight" {...rise(8)}>
            <h3>{t('dash.oldest')}</h3>
            <Anchor component="button" type="button" className="big-link" onClick={() => onOpenPerson(stats.oldest!.person.id)}>
              {fullName(stats.oldest.person)}
            </Anchor>
            <p className="muted">{t('dash.years', { n: stats.oldest.age })}</p>
          </motion.section>
        )}

        {role != null && (
          <motion.section className="card" {...rise(9)}>
            <h3>{t('dash.birthdays')}</h3>
            {stats.birthdays.length === 0 ? (
              <p className="muted">{t('dash.noBirthdays')}</p>
            ) : (
              <ul className="links">
                {stats.birthdays.slice(0, 6).map((b) => (
                  <li key={b.person.id}>
                    <span className="day-badge">{b.day}</span>
                    <Anchor component="button" type="button" onClick={() => onOpenPerson(b.person.id)}>
                      {fullName(b.person)}
                    </Anchor>
                    {b.age != null && <span className="muted small">{t('dash.turns', { n: b.age })}</span>}
                  </li>
                ))}
              </ul>
            )}
          </motion.section>
        )}

        <motion.section className="card span2" {...rise(10)}>
          <h3>{t('dash.quality')}</h3>
          <div className="quality">
            <div>
              <div className="row between">
                <span>{t('dash.withBirth')}</span>
                <strong>{total - stats.missingBirth}/{total}</strong>
              </div>
              <Progress value={total - stats.missingBirth} total={total} />
            </div>
            <div>
              <div className="row between">
                <span>
                  <Camera size={14} /> {t('dash.withPhoto')}
                </span>
                <strong>{total - stats.missingPhoto}/{total}</strong>
              </div>
              <Progress value={total - stats.missingPhoto} total={total} />
            </div>
            <div>
              <div className="row between">
                <span>{t('dash.consistent')}</span>
                <strong>{total - stats.withWarnings}/{total}</strong>
              </div>
              <Progress value={total - stats.withWarnings} total={total} tone={stats.withWarnings ? 'warn' : 'good'} />
            </div>
          </div>
          <div className="row wrap quality-actions">
            {stats.withWarnings > 0 && firstWarning != null && (
              <Button variant="default" onClick={() => onOpenPerson(firstWarning)}>{t('dash.fixWarnings', { n: stats.withWarnings })}</Button>
            )}
            {stats.isolated > 0 && <span className="chip">{t('dash.isolated', { n: stats.isolated })}</span>}
            {stats.floating > 0 && <span className="chip">{t('dash.floating', { n: stats.floating })}</span>}
            {stats.withWarnings === 0 && stats.isolated === 0 && stats.floating === 0 && <span className="chip ok">{t('dash.allGood')}</span>}
          </div>
        </motion.section>

        {canEdit && (
          <motion.section className="card span2" {...rise(11)}>
            <h3>{t('dash.activity')}</h3>
            {activity === null ? (
              <p className="muted">{t('common.loading')}</p>
            ) : activity.length === 0 ? (
              <p className="muted">{t('dash.noActivity')}</p>
            ) : (
              <ul className="timeline">
                {activity.map((h) => (
                  <li key={h.id}>
                    <span className={`tag ${h.action.toLowerCase()}`}>{t(`history.${h.action}`)}</span>
                    <strong>{h.label}</strong>
                    <span className="muted small">
                      {h.userName ?? t('panel.deletedUser')} · {new Date(h.createdAt).toLocaleDateString(lang)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </motion.section>
        )}
      </div>
    </div>
  )
}

