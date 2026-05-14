import { useState, useMemo } from 'react'
import { useRoleplayData } from '../api/roleplayQueries'
import { useAppStore } from '../store'
import { useTranslation } from '../lib/i18n'
import {
  computeRpKPIs,
  computeRpTrend,
  computeScoreDimensions,
  computeRpActivityStats,
  computeRpUserStats,
  computeRpScoreDistribution,
  computeCriteriaStats,
} from '../lib/roleplayAnalytics'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts'
import { ScoreDimensionRadar } from '../components/charts/ScoreDimensionRadar'
import { CriteriaChart } from '../components/charts/CriteriaChart'
import { TooltipShell, TRow, TTitle, TDivider, useTooltipColors } from '../components/charts/TooltipShell'
import { useChartColors } from '../lib/chartTheme'
import {
  Brain, Mic, Eye, Zap, Users, Building2, ChevronDown, RefreshCw, TrendingUp,
  Clock, PlayCircle, Activity,
} from 'lucide-react'
import { cn } from '../lib/cn'

// ── Tooltips ──────────────────────────────────

function TrendTooltip({ active, payload, label, language, c }: any) {
  if (!active || !payload?.length) return null
  return (
    <TooltipShell minWidth={160} c={c}>
      <TTitle text={label ?? ''} c={c} />
      <TDivider c={c} />
      <TRow label={language === 'es' ? 'Puntaje Total' : 'Total Score'} value={`${payload[0]?.value ?? 0}`} valueStyle={{ color: c.accent }} c={c} />
      <TRow label={language === 'es' ? 'IA Robin' : 'AI Robin'} value={`${payload[1]?.value ?? 0}%`} valueStyle={{ color: '#8B5CF6' }} c={c} />
      <TRow label={language === 'es' ? 'Sesiones' : 'Sessions'} value={payload[0]?.payload?.count ?? 0} valueStyle={{ color: c.value }} c={c} />
    </TooltipShell>
  )
}

function DistTooltip({ active, payload, language, c }: any) {
  if (!active || !payload?.length) return null
  return (
    <TooltipShell minWidth={140} c={c}>
      <TTitle text={payload[0]?.payload?.label ?? ''} c={c} />
      <TRow label={language === 'es' ? 'Sesiones' : 'Sessions'} value={payload[0]?.value} valueStyle={{ color: c.accent }} c={c} />
    </TooltipShell>
  )
}

// ── KPI Card ──────────────────────────────────

function RpKpiCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string; value: string | number; sub?: string
  color: 'accent' | 'violet' | 'success' | 'warning' | 'indigo'
}) {
  const colorMap: Record<string, string> = {
    accent:  'text-accent bg-accent/10',
    violet:  'text-violet bg-violet/10',
    success: 'text-success bg-success/10',
    warning: 'text-yellow-400 bg-yellow-400/10',
    indigo:  'text-indigo bg-indigo/10',
  }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500 font-medium mb-1 truncate">{label}</p>
          <p className="metric-value">{value}</p>
          {sub && <p className="text-[11px] text-slate-600 mt-1">{sub}</p>}
        </div>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ml-3', colorMap[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  )
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-6 h-0.5 rounded-full"
        style={{
          background: dashed ? 'transparent' : color,
          borderTop: dashed ? `2px dashed ${color}` : undefined,
        }}
      />
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export default function RoleplayPage() {
  const { language } = useAppStore()
  const t = useTranslation(language)
  const c = useChartColors()
  const tt = useTooltipColors()

  const {
    actividades, userActRub, sessions, isLoading, isError, refetch,
  } = useRoleplayData()

  const [selectedActivity, setSelectedActivity] = useState<string | null>(null)

  const kpis       = useMemo(() => computeRpKPIs(sessions, actividades), [sessions, actividades])
  const trend      = useMemo(() => computeRpTrend(sessions), [sessions])
  const dimensions = useMemo(() => computeScoreDimensions(sessions, language), [sessions, language])
  const actStats   = useMemo(() => computeRpActivityStats(sessions, actividades), [sessions, actividades])
  const userStats  = useMemo(() => computeRpUserStats(sessions, actividades, userActRub), [sessions, actividades, userActRub])
  const scoreDist  = useMemo(() => computeRpScoreDistribution(sessions), [sessions])
  const criteriaStats = useMemo(
    () => computeCriteriaStats(sessions, selectedActivity, actividades),
    [sessions, selectedActivity, actividades],
  )
  const activityNames = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.Actividad_Rub_Nombre))).sort(),
    [sessions],
  )

  const es = language === 'es'

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 skeleton rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-5 h-28 skeleton rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-5 h-80 skeleton rounded-xl lg:col-span-2" />
          <div className="card p-5 h-80 skeleton rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-slate-400">{t('error')}</p>
        <button onClick={refetch} className="btn-primary">{t('retry')}</button>
      </div>
    )
  }

  if (!sessions.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">{t('page_roleplay_title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('page_roleplay_subtitle')}</p>
        </div>
        <div className="card p-10 flex flex-col items-center gap-3">
          <Brain className="w-12 h-12 text-slate-600" />
          <p className="text-slate-400 text-sm">{t('no_data')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">{t('page_roleplay_title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('page_roleplay_subtitle')}</p>
        </div>
        <button onClick={refetch} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-200 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          {t('retry')}
        </button>
      </div>

      {/* KPI Row 1 — Volume */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <RpKpiCard icon={Brain}      label={t('rp_kpi_sessions')}  value={kpis.totalSessions.toLocaleString()} sub={t('rp_kpi_sessions_sub')} color="violet" />
        <RpKpiCard icon={TrendingUp} label={t('rp_kpi_avg_score')} value={`${kpis.avgTotalScore}`}             sub={t('rp_kpi_avg_score_sub')} color="accent" />
        <RpKpiCard icon={Users}      label={t('rp_kpi_users')}     value={kpis.activeUsers}                    sub={t('rp_kpi_users_sub')} color="success" />
        <RpKpiCard icon={Building2}  label={t('rp_kpi_branches')}  value={kpis.activeBranches}                 sub={t('rp_kpi_branches_sub')} color="indigo" />
      </div>

      {/* KPI Row 2 — AI Dimensions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <RpKpiCard icon={Brain}       label={t('rp_dim_robin')}  value={`${kpis.avgRobinPct}%`}  color="violet" />
        <RpKpiCard icon={Eye}         label={t('rp_dim_facial')} value={`${kpis.avgFacialPct}%`} color="warning" />
        <RpKpiCard icon={Mic}         label={t('rp_dim_voice')}  value={`${kpis.avgVoicePct}%`}  color="success" />
        <RpKpiCard icon={Zap}         label={t('rp_dim_wpm')}    value={`${kpis.avgWpmPct}%`}    color="accent" />
      </div>

      {/* Extra KPIs row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <RpKpiCard icon={Activity}   label={es ? 'Actividades' : 'Activities'}           value={kpis.totalActivities}                                       color="indigo" />
        <RpKpiCard icon={PlayCircle} label={es ? 'Intentos Prom.' : 'Avg. Attempts'}     value={kpis.avgRecordingAttempts}                                   sub={es ? 'grabaciones por sesión' : 'recordings per session'} color="accent" />
        <RpKpiCard icon={Clock}      label={es ? 'Duración Prom.' : 'Avg. Duration'}     value={`${Math.round(kpis.avgVideoDuration)}s`}                     sub={es ? 'por video' : 'per video'} color="violet" />
        <RpKpiCard icon={Brain}      label={es ? 'MC Criterios Prom.' : 'MC Criteria Avg'} value={kpis.avgCriteriaRate > 0 ? `${kpis.avgCriteriaRate}%` : '—'} sub={es ? '% cumplidos' : '% met'} color="success" />
      </div>

      {/* Trend + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">{t('rp_score_trend')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="rpScoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rpRobinGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: c.tick }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: c.tick }} axisLine={false} tickLine={false} />
                <Tooltip content={<TrendTooltip language={language} c={tt} />} cursor={{ stroke: c.cursorStroke, strokeWidth: 1.5 }} wrapperStyle={{ zIndex: 50, outline: 'none' }} />
                <Area type="monotone" dataKey="avgScore" stroke="#3B82F6" strokeWidth={2.5} fill="url(#rpScoreGrad)" dot={false} activeDot={{ r: 5, fill: '#3B82F6' }} />
                <Area type="monotone" dataKey="avgRobin" stroke="#8B5CF6" strokeWidth={1.5} fill="url(#rpRobinGrad)" dot={false} strokeDasharray="4 2" activeDot={{ r: 4, fill: '#8B5CF6' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2">
            <LegendDot color="#3B82F6" label={t('rp_legend_total')} />
            <LegendDot color="#8B5CF6" label={t('rp_dim_robin')} dashed />
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-1">{t('rp_score_dimensions')}</h3>
          <p className="text-[11px] text-slate-600 mb-3">{t('rp_score_dimensions_sub')}</p>
          <ScoreDimensionRadar data={dimensions} language={language} height={220} />
        </div>
      </div>

      {/* Activity Breakdown + Score Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">{t('rp_activity_breakdown')}</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {actStats.map((a) => (
              <div key={a.name} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-200 truncate">{a.name}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {a.count} {t('rp_sessions_label')} · {a.assignedBranches} {es ? 'sucursales' : 'branches'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-slate-100">{a.avgScore}</p>
                  <p className="text-[10px] text-slate-600">Robin {a.avgRobin}%</p>
                </div>
                <div className="w-20 h-1.5 bg-surface rounded-full shrink-0">
                  <div className="h-full rounded-full bg-violet" style={{ width: `${Math.min(100, a.avgRobin)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">{t('rp_score_dist')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDist} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: c.tick }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: c.tick }} axisLine={false} tickLine={false} />
                <Tooltip content={<DistTooltip language={language} c={tt} />} cursor={{ fill: c.cursorFill }} wrapperStyle={{ zIndex: 50, outline: 'none' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {scoreDist.map((entry, i) => (
                    <Cell key={i} fill={entry.max <= 60 ? '#EF4444' : '#8B5CF6'} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Criteria Fulfillment */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">{t('rp_criteria_title')}</h3>
            <p className="text-[11px] text-slate-600 mt-0.5">{t('rp_criteria_sub')}</p>
          </div>
          <div className="relative">
            <select
              value={selectedActivity ?? ''}
              onChange={(e) => setSelectedActivity(e.target.value || null)}
              className="appearance-none bg-surface border border-line text-slate-300 text-xs rounded-lg px-3 py-1.5 pr-7 focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="">{t('filter_all_activities')}</option>
              {activityNames.map((name) => (
                <option key={name} value={name}>{name.length > 40 ? name.slice(0, 40) + '…' : name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
          </div>
        </div>
        {criteriaStats.length ? (
          <CriteriaChart data={criteriaStats} language={language} height={260} />
        ) : (
          <div className="h-40 flex items-center justify-center text-slate-600 text-sm">
            {es ? 'Selecciona una actividad con criterios MC' : 'Select an activity with MC criteria'}
          </div>
        )}
        <div className="flex gap-4 mt-3 flex-wrap">
          <LegendDot color="#10B981" label={es ? '≥ 70% cumplido' : '≥ 70% met'} />
          <LegendDot color="#3B82F6" label="40–69%" />
          <LegendDot color="#EF4444" label={es ? '< 40%' : '< 40%'} />
        </div>
      </div>

      {/* Top Performers */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">{t('rp_top_performers')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-line/30">
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-4">{t('col_rank')}</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-4">{t('col_advisor')}</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-4">{t('rp_col_branch')}</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-4">{t('col_simulations')}</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-4">{t('col_avg_score')}</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-4">{t('rp_col_robin')}</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600">{es ? 'Intentos' : 'Attempts'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/20">
              {userStats.slice(0, 10).map((u, i) => (
                <tr key={u.userId} className="hover:bg-white/[0.015] transition-colors">
                  <td className="py-2 pr-4">
                    <span className={cn(
                      'inline-flex w-6 h-6 rounded-full items-center justify-center text-[10px] font-bold',
                      i === 0 ? 'bg-yellow-500/15 text-yellow-500' :
                      i === 1 ? 'bg-slate-400/15 text-slate-300' :
                      i === 2 ? 'bg-orange-500/15 text-orange-400' :
                      'bg-surface text-slate-600',
                    )}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-slate-200 font-medium truncate max-w-[160px]">{u.name}</td>
                  <td className="py-2 pr-4 text-slate-500 text-xs truncate max-w-[120px]">{u.branch}</td>
                  <td className="py-2 pr-4 text-slate-400">{u.count}</td>
                  <td className="py-2 pr-4 font-semibold text-slate-100">{u.avgScore}</td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 bg-surface rounded-full">
                        <div className="h-full rounded-full bg-violet" style={{ width: `${u.avgRobin}%` }} />
                      </div>
                      <span className="text-xs text-slate-400">{u.avgRobin}%</span>
                    </div>
                  </td>
                  <td className="py-2 text-slate-500 text-xs">{u.avgAttempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
