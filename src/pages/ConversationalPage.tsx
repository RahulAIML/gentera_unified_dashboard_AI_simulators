import { useDashboardData } from '../hooks/useDashboardData'
import { useAppStore } from '../store'
import { useTranslation } from '../lib/i18n'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import { MessageSquare, BarChart2 } from 'lucide-react'
import { useChartColors } from '../lib/chartTheme'
import { TooltipShell, TRow, TTitle, useTooltipColors, type TooltipColors } from '../components/charts/TooltipShell'

function RoundTooltip({
  active, payload, label, es, c,
}: {
  active?: boolean; payload?: any[]; label?: string; es: boolean; c: TooltipColors
}) {
  if (!active || !payload?.length) return null
  return (
    <TooltipShell c={c} minWidth={180}>
      <TTitle text={String(label ?? '')} c={c} />
      {payload.map((p: any) => (
        <TRow
          key={p.dataKey}
          label={p.dataKey === 'avg'
            ? (es ? 'Puntaje Prom.' : 'Avg Score')
            : (es ? 'Tasa Aprobación' : 'Pass Rate')}
          value={`${p.value}%`}
          valueStyle={{ color: p.stroke ?? p.fill }}
          c={c}
        />
      ))}
    </TooltipShell>
  )
}

// Legend renderer — keeps line/dot style consistent with chart series
function renderLegend(props: any) {
  const { payload } = props
  if (!payload?.length) return null
  return (
    <div className="flex gap-4 justify-center mt-2">
      {payload.map((entry: any) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: entry.color }} />
          <span className="text-[11px] text-slate-500">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function ConversationalPage() {
  const { language } = useAppStore()
  const t = useTranslation(language)
  const c  = useChartColors()
  const tt = useTooltipColors()
  const es = language === 'es'

  const { isLoading, isError, roundStats, refetch } = useDashboardData()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 skeleton rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5 h-80 skeleton rounded-xl" />
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

  const stats = roundStats ?? []

  if (!stats.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">{t('page_conv_title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('page_conv_subtitle')}</p>
        </div>
        <div className="card p-10 flex flex-col items-center gap-3">
          <MessageSquare className="w-12 h-12 text-slate-600" />
          <p className="text-slate-400 text-sm">{t('no_data')}</p>
        </div>
      </div>
    )
  }

  const radarData = stats.map((r) => ({
    round: `${t('round')} ${r.round}`,
    [es ? 'Puntaje Prom.' : 'Avg Score']:    r.avg,
    [es ? 'Tasa Aprobación' : 'Pass Rate']:  r.passRate,
  }))

  // Keys for recharts — derived from locale so tooltips and legends stay in sync
  const avgKey      = es ? 'Puntaje Prom.'  : 'Avg Score'
  const passKey     = es ? 'Tasa Aprobación' : 'Pass Rate'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-50 tracking-tight">{t('page_conv_title')}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{t('page_conv_subtitle')}</p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        <span className="text-[11px] text-slate-400 bg-card border border-line/30 px-3 py-1 rounded-full">
          {stats.length} {es ? 'interacciones activas' : 'active interactions'}
        </span>
        <span className="text-[11px] text-accent bg-accent/5 border border-accent/20 px-3 py-1 rounded-full">
          {es ? 'Prom. puntos: ' : 'Avg score: '}
          {Math.round(stats.reduce((s, r) => s + r.avg, 0) / stats.length * 100) / 100}
        </span>
        <span className="text-[11px] text-success bg-success/5 border border-success/20 px-3 py-1 rounded-full">
          {es ? 'Prom. aprobación: ' : 'Avg pass rate: '}
          {Math.round(stats.reduce((s, r) => s + r.passRate, 0) / stats.length)}%
        </span>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Radar — shape / pattern view */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-slate-200">
              {es ? 'Perfil de Interacciones' : 'Interaction Profile'}
            </h3>
          </div>
          <p className="text-[11px] text-slate-600 mb-4">
            {es ? 'Forma del rendimiento por interacción' : 'Performance shape across interactions'}
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
                <PolarGrid />
                <PolarAngleAxis
                  dataKey="round"
                  tick={{ fontSize: 11, fill: c.tick }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tickCount={4}
                  tick={{ fontSize: 9, fill: c.tick }}
                  axisLine={false}
                />
                <Radar
                  name={avgKey}
                  dataKey={avgKey}
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Radar
                  name={passKey}
                  dataKey={passKey}
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Tooltip
                  content={<RoundTooltip es={es} c={tt} />}
                  wrapperStyle={{ zIndex: 50, outline: 'none' }}
                />
                <Legend content={renderLegend} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar — absolute values per interaction */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-4 h-4 text-violet" />
            <h3 className="text-sm font-semibold text-slate-200">
              {es ? 'Puntuación por Interacción' : 'Score by Interaction'}
            </h3>
          </div>
          <p className="text-[11px] text-slate-600 mb-4">
            {es ? 'Puntaje promedio y tasa de aprobación por paso' : 'Avg score and pass rate per step'}
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={radarData}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                barCategoryGap="25%"
                barGap={3}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="round"
                  tick={{ fontSize: 11, fill: c.tick }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: c.tick }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<RoundTooltip es={es} c={tt} />}
                  wrapperStyle={{ zIndex: 50, outline: 'none' }}
                  cursor={{ fill: c.cursorFill }}
                />
                <Legend content={renderLegend} />
                <Bar dataKey={avgKey}  fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={28} />
                <Bar dataKey={passKey} fill="#10B981" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Per-interaction detail table */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">
          {es ? 'Detalle por Interacción' : 'Interaction Detail'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line/30 text-left">
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-4">
                  {es ? 'Interacción' : 'Interaction'}
                </th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-4 text-right">
                  {es ? 'Evaluaciones' : 'Evaluations'}
                </th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-4 text-right">
                  {es ? 'Puntaje Prom.' : 'Avg Score'}
                </th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 text-right">
                  {es ? 'Tasa Aprobación' : 'Pass Rate'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/20">
              {stats.map((r) => (
                <tr key={r.round} className="hover:bg-white/[0.015] transition-colors">
                  <td className="py-2.5 pr-4 font-medium text-slate-200">
                    {t('round')} {r.round}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-400 text-right tabular-nums">
                    {r.count.toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">
                    <span className={`font-semibold ${r.avg >= 0.7 ? 'text-success' : r.avg >= 0.4 ? 'text-yellow-400' : 'text-danger'}`}>
                      {r.avg}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      r.passRate >= 60
                        ? 'bg-success/10 text-success'
                        : r.passRate >= 40
                          ? 'bg-yellow-400/10 text-yellow-400'
                          : 'bg-danger/10 text-danger'
                    }`}>
                      {r.passRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
