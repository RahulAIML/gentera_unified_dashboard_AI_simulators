import { useState, useMemo } from 'react'
import { useRoleplayData } from '../api/roleplayQueries'
import { useAppStore } from '../store'
import { useTranslation } from '../lib/i18n'
import {
  computeRpKPIs, computeRpTrend, computeScoreDimensions,
  computeRpActivityStats, computeRpUserStats, computeRpScoreDistribution,
  computeCriteriaStats, parseRpDate,
} from '../lib/roleplayAnalytics'
import { DateRangeFilter, inDateRange } from '../components/ui/DateRangeFilter'
import { downloadCSV, csvDate } from '../lib/csvExport'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts'
import { ScoreDimensionRadar } from '../components/charts/ScoreDimensionRadar'
import { CriteriaChart } from '../components/charts/CriteriaChart'
import { TooltipShell, TRow, TTitle, TDivider, useTooltipColors } from '../components/charts/TooltipShell'
import { useChartColors } from '../lib/chartTheme'
import {
  Brain, Mic, Eye, Zap, Users, Building2, ChevronDown,
  RefreshCw, TrendingUp, Clock, PlayCircle, Download, CheckCircle2, ExternalLink,
} from 'lucide-react'
import { cn } from '../lib/cn'

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

function RpKpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string }>
  label: string; value: string | number; sub?: string
  color: 'accent' | 'violet' | 'success' | 'warning' | 'indigo'
}) {
  const colorMap: Record<string, string> = {
    accent:  'text-accent bg-accent/10',   violet:  'text-violet bg-violet/10',
    success: 'text-success bg-success/10', warning: 'text-yellow-400 bg-yellow-400/10',
    indigo:  'text-indigo bg-indigo/10',
  }
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500 font-medium mb-1 truncate">{label}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-base)' }}>{value}</p>
          {sub && <p className="text-[11px] text-slate-600 mt-1 truncate">{sub}</p>}
        </div>
        <div className={cn('w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 ml-2', colorMap[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  )
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-6 h-0.5 rounded-full" style={{
        background: dashed ? 'transparent' : color,
        borderTop: dashed ? `2px dashed ${color}` : undefined,
      }} />
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  )
}

export default function RoleplayPage() {
  const { language } = useAppStore()
  const t = useTranslation(language)
  const c = useChartColors()
  const tt = useTooltipColors()
  const es = language === 'es'

  const { actividades, userActRub, sessions: allSessions, isLoading, isError, refetch } = useRoleplayData()

  const [from, setFrom] = useState('')
  const [to,   setTo]   = useState('')
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null)

  // ── Date-filtered sessions ───────────────────
  const sessions = useMemo(() => {
    if (!from && !to) return allSessions
    return allSessions.filter((s) => {
      const d = parseRpDate(s.Fecha_y_Hora)
      if (!d) return false
      return inDateRange(d.toISOString().split('T')[0], from, to)
    })
  }, [allSessions, from, to])

  const kpis        = useMemo(() => computeRpKPIs(sessions, actividades), [sessions, actividades])
  const trend       = useMemo(() => computeRpTrend(sessions), [sessions])
  const dimensions  = useMemo(() => computeScoreDimensions(sessions, language), [sessions, language])
  const actStats    = useMemo(() => computeRpActivityStats(sessions, actividades), [sessions, actividades])
  const userStats   = useMemo(() => computeRpUserStats(sessions, actividades, userActRub), [sessions, actividades, userActRub])
  const scoreDist   = useMemo(() => computeRpScoreDistribution(sessions), [sessions])
  const criteriaStats = useMemo(
    () => computeCriteriaStats(sessions, selectedActivity, actividades),
    [sessions, selectedActivity, actividades],
  )
  const activityNames = useMemo(
    () => Array.from(new Set(allSessions.map((s) => s.Actividad_Rub_Nombre))).sort(),
    [allSessions],
  )

  // Criteria defined in Dim_Actividades_Rub for the selected activity (regardless of sessions)
  const actDef = useMemo(() => {
    if (selectedActivity) return actividades.find((a) => a.Actividad_Rub_Nombre === selectedActivity)
    return actividades[0]
  }, [selectedActivity, actividades])

  const definedCriteria = useMemo(() => {
    if (!actDef) return []
    return Array.from({ length: actDef.Numero_MC }, (_, i) => {
      const label = actDef[`MC_${i + 1}` as keyof typeof actDef] as string
      return label && label !== 'No aplica' ? { index: i + 1, label } : null
    }).filter(Boolean) as { index: number; label: string }[]
  }, [actDef])

  const mcHasData = criteriaStats.length > 0
  const mcNoneScored = !mcHasData && definedCriteria.length > 0

  // ── CSV exports ──────────────────────────────
  function exportSessionsCSV() {
    if (!sessions.length) return
    const rows: (string | number)[][] = [[
      'ID', es ? 'Usuario' : 'User', es ? 'Sucursal' : 'Branch',
      es ? 'Actividad' : 'Activity', es ? 'Fecha' : 'Date',
      es ? 'Puntaje Total' : 'Total Score', 'Robin %', 'Facial %',
      es ? 'Voz %' : 'Voice %', 'PPM %',
      es ? 'Grabaciones' : 'Recordings', es ? 'Duración (s)' : 'Duration (s)',
    ]]
    sessions.forEach((s) => rows.push([
      s.ID_Ejercicio_Rub, s.Usuario_Nombre, s.Administrador_Nombre,
      s.Actividad_Rub_Nombre, s.Fecha, s.Puntos_Totales,
      s.Porcentaje_Robin, s.Porcentaje_Facial, s.Porcentaje_Voz,
      s.Porcentaje_Palabras_por_Minuto, s.Grabaciones_Totales, s.Duracion_del_Video,
    ]))
    downloadCSV(rows, `gentera_rp_sessions_${csvDate()}.csv`)
  }

  function exportActivityCSV() {
    if (!actStats.length) return
    const rows: (string | number)[][] = [[
      es ? 'Actividad' : 'Activity', es ? 'Sesiones' : 'Sessions',
      es ? 'Puntaje Prom.' : 'Avg Score', 'Robin %',
      es ? 'Sucursales' : 'Branches',
    ]]
    actStats.forEach((a) => rows.push([a.name, a.count, a.avgScore, a.avgRobin, a.assignedBranches]))
    downloadCSV(rows, `gentera_rp_activities_${csvDate()}.csv`)
  }

  function exportUsersCSV() {
    if (!userStats.length) return
    const rows: (string | number)[][] = [[
      es ? 'Usuario' : 'User', es ? 'Sucursal' : 'Branch',
      es ? 'Sesiones' : 'Sessions', es ? 'Puntaje Prom.' : 'Avg Score',
      'Robin %', es ? 'Mejor Puntaje' : 'Best Score',
    ]]
    userStats.forEach((u) => rows.push([u.name, u.branch, u.count, u.avgScore, u.avgRobin, u.bestScore]))
    downloadCSV(rows, `gentera_rp_users_${csvDate()}.csv`)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 skeleton rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-5 h-28 skeleton rounded-xl" />
          ))}
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

  if (!allSessions.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-50 tracking-tight">{t('page_roleplay_title')}</h1>
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-50 tracking-tight">{t('page_roleplay_title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('page_roleplay_subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter from={from} to={to} onFrom={setFrom} onTo={setTo} label={es ? 'Período' : 'Period'} />
          <button onClick={exportSessionsCSV} disabled={!sessions.length}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 border border-line/50 hover:border-line rounded-lg px-2 sm:px-3 py-1.5 transition-all disabled:opacity-40"
            title={es ? 'Sesiones CSV' : 'Sessions CSV'}>
            <Download className="w-3.5 h-3.5" /><span className="hidden sm:inline">{es ? 'Sesiones' : 'Sessions'}</span>
          </button>
          <button onClick={exportActivityCSV} disabled={!actStats.length}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 border border-line/50 hover:border-line rounded-lg px-2 sm:px-3 py-1.5 transition-all disabled:opacity-40"
            title={es ? 'Actividades CSV' : 'Activities CSV'}>
            <Download className="w-3.5 h-3.5" /><span className="hidden sm:inline">{es ? 'Actividades' : 'Activities'}</span>
          </button>
          <button onClick={exportUsersCSV} disabled={!userStats.length}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 border border-line/50 hover:border-line rounded-lg px-2 sm:px-3 py-1.5 transition-all disabled:opacity-40"
            title={es ? 'Usuarios CSV' : 'Users CSV'}>
            <Download className="w-3.5 h-3.5" /><span className="hidden sm:inline">{es ? 'Usuarios' : 'Users'}</span>
          </button>
          <button onClick={refetch} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-200 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Active filter badge */}
      {(from || to) && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full">
            {from && to ? `${from} → ${to}` : from ? `≥ ${from}` : `≤ ${to}`}
            {' · '}{sessions.length} {es ? 'sesiones' : 'sessions'}
          </span>
          <button onClick={() => { setFrom(''); setTo('') }} className="text-[11px] text-slate-500 hover:text-slate-300">✕ {es ? 'Limpiar' : 'Clear'}</button>
        </div>
      )}

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <RpKpiCard icon={Brain}      label={t('rp_kpi_sessions')}  value={kpis.totalSessions.toLocaleString()} sub={t('rp_kpi_sessions_sub')}  color="violet" />
        <RpKpiCard icon={TrendingUp} label={t('rp_kpi_avg_score')} value={`${kpis.avgTotalScore}`}             sub={t('rp_kpi_avg_score_sub')} color="accent" />
        <RpKpiCard icon={Users}      label={t('rp_kpi_users')}     value={kpis.activeUsers}                    sub={t('rp_kpi_users_sub')}     color="success" />
        <RpKpiCard icon={Building2}  label={t('rp_kpi_branches')}  value={kpis.activeBranches}                 sub={t('rp_kpi_branches_sub')}  color="indigo" />
      </div>

      {/* KPI Row 2 — AI Dimensions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <RpKpiCard icon={Brain} label={t('rp_dim_robin')}  value={`${kpis.avgRobinPct}%`}  color="violet" />
        <RpKpiCard icon={Eye}   label={t('rp_dim_facial')} value={`${kpis.avgFacialPct}%`} color="warning" />
        <RpKpiCard icon={Mic}   label={t('rp_dim_voice')}  value={`${kpis.avgVoicePct}%`}  color="success" />
        <RpKpiCard icon={Zap}   label={t('rp_dim_wpm')}    value={`${kpis.avgWpmPct}%`}    color="accent" />
      </div>

      {/* KPI Row 3 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <RpKpiCard icon={PlayCircle} label={es ? 'Actividades' : 'Activities'}         value={kpis.totalActivities}                                         color="indigo" />
        <RpKpiCard icon={RefreshCw}  label={es ? 'Intentos Prom.' : 'Avg. Attempts'}   value={kpis.avgRecordingAttempts}                                     sub={es ? 'grabaciones/sesión' : 'recordings/session'} color="accent" />
        <RpKpiCard icon={Clock}      label={es ? 'Duración Prom.' : 'Avg. Duration'}   value={`${Math.round(kpis.avgVideoDuration)}s`}                       sub={es ? 'por video' : 'per video'} color="violet" />
        <RpKpiCard icon={Brain}      label={es ? 'Criterios MC' : 'MC Criteria'}       value={kpis.avgCriteriaRate > 0 ? `${kpis.avgCriteriaRate}%` : '—'}   sub={es ? '% cumplidos' : '% met'}   color="success" />
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
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedActivity ?? ''}
                onChange={(e) => setSelectedActivity(e.target.value || null)}
                className="appearance-none bg-surface border border-line text-slate-300 text-xs rounded-lg px-3 py-1.5 pr-7 focus:outline-none focus:border-accent cursor-pointer max-w-[200px] sm:max-w-xs truncate"
              >
                <option value="">{t('filter_all_activities')}</option>
                {activityNames.map((name) => (
                  <option key={name} value={name}>{name.length > 40 ? name.slice(0, 40) + '…' : name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {mcHasData ? (
          <>
            <CriteriaChart data={criteriaStats} language={language} height={260} />
            <div className="flex gap-4 mt-3 flex-wrap">
              <LegendDot color="#10B981" label={es ? '≥ 70% cumplido' : '≥ 70% met'} />
              <LegendDot color="#3B82F6" label="40–69%" />
              <LegendDot color="#EF4444" label="< 40%" />
            </div>
          </>
        ) : mcNoneScored ? (
          /* Show defined criteria list when sessions exist but MC not yet scored */
          <div>
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-yellow-400/5 border border-yellow-400/20">
              <Brain className="w-4 h-4 text-yellow-400 shrink-0" />
              <p className="text-xs text-yellow-300">
                {es
                  ? 'Los criterios MC están definidos para esta actividad, pero aún no se han registrado evaluaciones en las sesiones actuales.'
                  : 'MC criteria are defined for this activity but have not been scored in current sessions yet.'}
              </p>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600 mb-3">
              {es ? `Criterios definidos — ${actDef?.Actividad_Rub_Nombre ?? ''}` : `Defined criteria — ${actDef?.Actividad_Rub_Nombre ?? ''}`}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {definedCriteria.map((cr) => (
                <div key={cr.index} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface border border-line/20">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-700 shrink-0 mt-0.5">
                    <span className="text-[9px] font-bold text-slate-400">{cr.index}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">{cr.label}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-slate-600 text-sm">
            {es ? 'Selecciona una actividad para ver sus criterios' : 'Select an activity to view its criteria'}
          </div>
        )}
      </div>

      {/* Top Performers */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">{t('rp_top_performers')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-line/30">
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-2 sm:pr-4">{t('col_rank')}</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-2 sm:pr-4">{t('col_advisor')}</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-2 sm:pr-4 hidden sm:table-cell">{t('rp_col_branch')}</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-2 sm:pr-4 hidden sm:table-cell">{t('col_simulations')}</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-2 sm:pr-4">{t('col_avg_score')}</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 hidden md:table-cell">{es ? 'Intentos' : 'Attempts'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/20">
              {userStats.slice(0, 10).map((u, i) => (
                <tr key={u.userId} className="hover:bg-white/[0.015] transition-colors">
                  <td className="py-2 pr-2 sm:pr-4">
                    <span className={cn(
                      'inline-flex w-6 h-6 rounded-full items-center justify-center text-[10px] font-bold',
                      i === 0 ? 'bg-yellow-500/15 text-yellow-500' :
                      i === 1 ? 'bg-slate-400/15 text-slate-300' :
                      i === 2 ? 'bg-orange-500/15 text-orange-400' :
                      'bg-surface text-slate-600',
                    )}>{i + 1}</span>
                  </td>
                  <td className="py-2 pr-2 sm:pr-4 text-slate-200 font-medium truncate max-w-[120px] sm:max-w-[160px] text-xs sm:text-sm">{u.name}</td>
                  <td className="py-2 pr-2 sm:pr-4 text-slate-500 text-xs truncate max-w-[100px] sm:max-w-[120px] hidden sm:table-cell">{u.branch}</td>
                  <td className="py-2 pr-2 sm:pr-4 text-slate-400 hidden sm:table-cell">{u.count}</td>
                  <td className="py-2 pr-2 sm:pr-4 font-semibold text-slate-100 text-sm">{u.avgScore}</td>
                  <td className="py-2 text-slate-500 text-xs hidden md:table-cell">{u.avgAttempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Records — with Enlace link */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              {es ? 'Registros de Sesiones' : 'Session Records'}
            </h3>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {es ? 'Accede a los resultados de cada sesión individual' : 'Access results for each individual session'}
            </p>
          </div>
          <span className="text-[11px] text-slate-600">
            {sessions.length} {es ? 'sesiones' : 'sessions'}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-line/30">
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-2 sm:pr-3">{es ? 'Fecha' : 'Date'}</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-2 sm:pr-3">{es ? 'Usuario' : 'User'}</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-2 sm:pr-3 hidden sm:table-cell">{es ? 'Sucursal' : 'Branch'}</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-2 sm:pr-3 hidden md:table-cell">{es ? 'Actividad' : 'Activity'}</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-2 sm:pr-3 text-right">{es ? 'Puntaje' : 'Score'}</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-2 sm:pr-3 text-right hidden sm:table-cell">Robin %</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-2 sm:pr-3 text-right hidden md:table-cell">{es ? 'Intentos' : 'Attempts'}</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 text-center">{es ? 'Resultado' : 'Result'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/20">
              {sessions.slice().sort((a, b) => b.ID_Ejercicio_Rub - a.ID_Ejercicio_Rub).map((s) => {
                const scoreNum = parseFloat(String(s.Puntos_Totales)) || 0
                const robinNum = Math.min(100, parseFloat(String(s.Porcentaje_Robin)) || 0)
                const hasLink  = s.Enlace_con_Resultados && s.Enlace_con_Resultados.startsWith('http')
                return (
                  <tr key={s.ID_Ejercicio_Rub} className="hover:bg-white/[0.015] transition-colors">
                    <td className="py-2 pr-2 sm:pr-3 text-slate-500 text-xs whitespace-nowrap">{s.Fecha}</td>
                    <td className="py-2 pr-2 sm:pr-3 text-slate-200 font-medium text-xs truncate max-w-[110px] sm:max-w-[140px]">{s.Usuario_Nombre}</td>
                    <td className="py-2 pr-2 sm:pr-3 text-slate-500 text-xs truncate max-w-[100px] sm:max-w-[120px] hidden sm:table-cell">{s.Administrador_Nombre}</td>
                    <td className="py-2 pr-2 sm:pr-3 text-slate-500 text-xs truncate max-w-[140px] sm:max-w-[160px] hidden md:table-cell">{s.Actividad_Rub_Nombre}</td>
                    <td className="py-2 pr-2 sm:pr-3 text-right">
                      <span className={cn(
                        'text-xs font-semibold tabular-nums',
                        scoreNum >= 70 ? 'text-success' : scoreNum >= 50 ? 'text-accent' : 'text-danger',
                      )}>
                        {scoreNum}
                      </span>
                    </td>
                    <td className="py-2 pr-2 sm:pr-3 text-right hidden sm:table-cell">
                      <span className="text-xs text-violet tabular-nums">{robinNum}%</span>
                    </td>
                    <td className="py-2 pr-2 sm:pr-3 text-right text-slate-500 text-xs tabular-nums hidden md:table-cell">
                      {s.Grabaciones_Totales ?? '—'}
                    </td>
                    <td className="py-2 text-center">
                      {hasLink ? (
                        <a
                          href={s.Enlace_con_Resultados}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-accent/10 hover:bg-accent/20 text-accent transition-colors"
                          title={es ? 'Ver resultado' : 'View result'}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-700 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
