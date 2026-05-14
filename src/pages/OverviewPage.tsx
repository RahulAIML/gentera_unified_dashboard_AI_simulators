import { useDashboardData } from '../hooks/useDashboardData'
import { useFactRolPlayRub } from '../api/roleplayQueries'
import { computeRpKPIs } from '../lib/roleplayAnalytics'
import { useAppStore } from '../store'
import { useTranslation } from '../lib/i18n'
import {
  BarChart3,
  PlayCircle,
  CheckCircle2,
  Users,
  Brain,
  Mic2,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'
import { Link } from 'react-router-dom'

const COLORS = {
  pass: '#10B981',
  fail: '#EF4444',
  accent: '#3B82F6',
  violet: '#8B5CF6',
}

export default function OverviewPage() {
  const { language } = useAppStore()
  const t = useTranslation(language)
  const { isLoading, isError, kpis, trend, scoreDist, actStats, userStats, refetch } = useDashboardData()
  const rpFact = useFactRolPlayRub()
  const rpKpis = rpFact.data?.length ? computeRpKPIs(rpFact.data, []) : null

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
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

  if (isError || !kpis) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-slate-400">{t('error')}</p>
        <button onClick={refetch} className="btn-primary">{t('retry')}</button>
      </div>
    )
  }

  const passFailData = [
    { name: t('pass'), value: kpis.passCount, color: COLORS.pass },
    { name: t('fail'), value: kpis.failCount, color: COLORS.fail },
  ]

  const topActivities = (actStats ?? []).slice(0, 5).map((a) => ({
    name: a.name.length > 24 ? a.name.slice(0, 24) + '...' : a.name,
    count: a.count,
    avgScore: a.avgScore,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-50 tracking-tight">{t('page_overview_title')}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{t('page_overview_subtitle')}</p>
      </div>

      {/* Simulator KPIs */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600 mb-2 flex items-center gap-1.5">
          <PlayCircle className="w-3 h-3" />
          {language === 'es' ? 'Simulador' : 'Simulator'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={PlayCircle} label={t('kpi_total_sims')} value={kpis.totalSimulations} sub={t('sub_across_activities')} color="accent" />
          <KpiCard icon={BarChart3} label={t('kpi_avg_score')} value={`${kpis.averageScore}%`} sub={t('sub_overall')} color="violet" />
          <KpiCard icon={CheckCircle2} label={t('kpi_pass_rate')} value={`${kpis.passRate}%`} sub={t('sub_sessions_passed')} color="pass" />
          <KpiCard icon={Users} label={t('kpi_active_advisors')} value={kpis.activeAdvisors} sub={t('sub_with_simulations')} color="indigo" />
        </div>
      </div>

      {/* Roleplay KPIs */}
      {rpKpis && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600 mb-2 flex items-center gap-1.5">
            <Mic2 className="w-3 h-3" />
            {language === 'es' ? 'Roleplay IA' : 'Roleplay AI'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={Mic2} label={t('rp_kpi_sessions')} value={rpKpis.totalSessions.toLocaleString()} sub={t('rp_kpi_sessions_sub')} color="violet" />
            <KpiCard icon={Brain} label={t('rp_dim_robin')} value={`${rpKpis.avgRobinPct}%`} sub={language === 'es' ? 'promedio IA' : 'AI avg'} color="indigo" />
            <KpiCard icon={BarChart3} label={t('rp_kpi_avg_score')} value={`${rpKpis.avgTotalScore}`} sub={t('rp_kpi_avg_score_sub')} color="accent" />
            <KpiCard icon={Users} label={t('rp_kpi_users')} value={rpKpis.activeUsers} sub={t('rp_kpi_users_sub')} color="pass" />
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">{t('score_trend')}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} />
                <YAxis domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1A2D45', borderRadius: 8 }} />
                <Area type="monotone" dataKey="avgScore" stroke={COLORS.accent} strokeWidth={2} fill="url(#scoreGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pass/Fail */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">{t('pass_fail_dist')}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={passFailData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {passFailData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1A2D45', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {passFailData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                {d.name}: {d.value}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity breakdown */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">{t('activity_breakdown')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topActivities} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 'dataMax + 5']} hide />
                <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1A2D45', borderRadius: 8 }} />
                <Bar dataKey="count" fill={COLORS.accent} radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top performers */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">{t('top_performers')}</h3>
            <Link to="/leaderboard" className="text-xs text-accent hover:underline">{t('view_all')}</Link>
          </div>
          <div className="space-y-2">
            {(userStats ?? []).slice(0, 5).map((u, i) => (
              <div key={u.name} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  i === 0 ? 'bg-yellow-500/15 text-yellow-500' :
                  i === 1 ? 'bg-slate-400/15 text-slate-300' :
                  i === 2 ? 'bg-orange-500/15 text-orange-400' :
                  'bg-surface text-slate-600'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{u.name}</p>
                  <p className="text-[11px] text-slate-600">{u.count} {t('simulations_count')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-100">{u.avgScore}%</p>
                  <p className="text-[11px] text-slate-600">{u.passRate}% {t('pass')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Score distribution */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">{t('score_distribution')}</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreDist ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1A2D45', borderRadius: 8 }} />
              <Bar dataKey="count" fill={COLORS.accent} radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  sub: string
  color: 'accent' | 'violet' | 'pass' | 'indigo'
}) {
  const colorMap = {
    accent: 'text-accent bg-accent/10',
    violet: 'text-violet bg-violet/10',
    pass: 'text-success bg-success/10',
    indigo: 'text-indigo bg-indigo/10',
  }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
          <p className="metric-value">{value}</p>
          <p className="text-[11px] text-slate-600 mt-1">{sub}</p>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  )
}
