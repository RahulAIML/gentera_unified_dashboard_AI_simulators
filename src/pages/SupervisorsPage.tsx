import { useMemo } from 'react'
import { useRoleplayData } from '../api/roleplayQueries'
import { useAppStore } from '../store'
import { useTranslation } from '../lib/i18n'
import {
  computeRpSupervisorStats,
  computeRpBranchStats,
} from '../lib/roleplayAnalytics'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { TooltipShell, TRow, TTitle, useTooltipColors } from '../components/charts/TooltipShell'
import { useChartColors } from '../lib/chartTheme'
import { UserCircle2, Building2, Users, TrendingUp, RefreshCw, Activity, Brain } from 'lucide-react'
import { cn } from '../lib/cn'

function BranchTooltip({ active, payload, language, c }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <TooltipShell minWidth={180} c={c}>
      <TTitle text={d.payload.name} c={c} />
      <TRow label={language === 'es' ? 'Sesiones' : 'Sessions'}     value={d.payload.count}        valueStyle={{ color: c.accent }} c={c} />
      <TRow label={language === 'es' ? 'Puntaje Prom.' : 'Avg Score'} value={d.payload.avgScore}   valueStyle={{ color: c.value }}  c={c} />
      <TRow label={language === 'es' ? 'Robin %' : 'Robin %'}        value={`${d.payload.avgRobin}%`} valueStyle={{ color: '#8B5CF6' }} c={c} />
      <TRow label={language === 'es' ? 'Usuarios' : 'Users'}         value={d.payload.activeUsers} valueStyle={{ color: c.muted }}  c={c} />
    </TooltipShell>
  )
}

export default function SupervisorsPage() {
  const { language } = useAppStore()
  const t = useTranslation(language)
  const c = useChartColors()
  const tt = useTooltipColors()

  const { supervisores, usuarios, superUser, superAdmin, superActRub, sessions, isLoading, isError, refetch } =
    useRoleplayData()

  const supervisorStats = useMemo(
    () => computeRpSupervisorStats(supervisores, superUser, superAdmin, superActRub, sessions),
    [supervisores, superUser, superAdmin, superActRub, sessions],
  )

  const branchStats = useMemo(() => computeRpBranchStats(sessions), [sessions])
  const top10 = branchStats.slice(0, 10)

  const es = language === 'es'

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 h-32 skeleton rounded-xl" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight">{t('page_supervisors_title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('page_supervisors_subtitle')}</p>
        </div>
        <button onClick={refetch} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-200 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          {t('retry')}
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: UserCircle2, label: es ? 'Supervisores' : 'Supervisors', value: supervisorStats.length, color: 'text-violet bg-violet/10' },
          { icon: Building2,   label: es ? 'Sucursales Activas' : 'Active Branches', value: branchStats.length, color: 'text-accent bg-accent/10' },
          { icon: Users,       label: es ? 'Sesiones Totales' : 'Total Sessions', value: sessions.length.toLocaleString(), color: 'text-success bg-success/10' },
          { icon: Brain,       label: es ? 'Robin Prom.' : 'Avg. Robin', value: `${branchStats.length ? Math.round(branchStats.reduce((s, b) => s + b.avgRobin, 0) / branchStats.length) : 0}%`, color: 'text-indigo bg-indigo/10' },
        ].map((item) => (
          <div key={item.label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">{item.label}</p>
                <p className="metric-value">{item.value}</p>
              </div>
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', item.color)}>
                <item.icon className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Supervisor cards */}
      {supervisorStats.filter(s => s.sessionCount > 0).length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-3">{t('rp_supervisors_section')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supervisorStats.filter(s => s.sessionCount > 0).map((sup) => (
              <div key={sup.supervisorKey} className="card p-5 hover:border-accent/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet/10 flex items-center justify-center shrink-0">
                    <UserCircle2 className="w-5 h-5 text-violet" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-100 truncate">{sup.name}</p>
                    <p className="text-[11px] text-slate-600 truncate">{sup.email}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <StatMini icon={Users}    label={es ? 'Usuarios' : 'Users'}     value={sup.userCount}    color="text-accent" />
                  <StatMini icon={TrendingUp} label={es ? 'Sesiones' : 'Sessions'} value={sup.sessionCount} color="text-violet" />
                  <StatMini icon={Building2} label={es ? 'Sucursales' : 'Branches'} value={sup.activeBranches} color="text-success" />
                </div>
                {sup.sessionCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-line/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-600">{es ? 'Puntaje prom.' : 'Avg. score'}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-surface rounded-full">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, sup.avgScore)}%`,
                              background: sup.avgScore >= 70 ? '#10B981' : sup.avgScore >= 50 ? '#3B82F6' : '#EF4444',
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-100">{sup.avgScore}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-600">{es ? 'Robin IA %' : 'AI Robin %'}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-surface rounded-full">
                          <div className="h-full rounded-full bg-violet" style={{ width: `${sup.avgRobin}%` }} />
                        </div>
                        <span className="text-sm font-semibold text-violet">{sup.avgRobin}%</span>
                      </div>
                    </div>
                    {sup.adminCount > 0 && (
                      <p className="text-[11px] text-slate-600">
                        {sup.adminCount} {es ? 'administradores asignados' : 'assigned admins'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Branch performance chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-1">{t('rp_branch_performance')}</h3>
        <p className="text-[11px] text-slate-600 mb-4">{t('rp_branch_performance_sub')}</p>
        {top10.length ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: c.tick }} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="name" type="category" width={140}
                  tick={{ fontSize: 10, fill: c.tick }} axisLine={false} tickLine={false}
                  tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '…' : v}
                />
                <Tooltip content={<BranchTooltip language={language} c={tt} />} cursor={{ fill: c.cursorFill }} wrapperStyle={{ zIndex: 50, outline: 'none' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
                  {top10.map((_, i) => (
                    <Cell key={i} fill="#8B5CF6" fillOpacity={0.85 - i * 0.02} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-slate-600 text-sm">{t('no_data')}</p>
        )}
      </div>

      {/* Branch table — full detail */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">{t('rp_branch_table')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-line/30">
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-4">{es ? 'Sucursal' : 'Branch'}</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-4">{es ? 'Sesiones' : 'Sessions'}</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-4">{es ? 'Usuarios' : 'Users'}</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-4">{es ? 'Puntaje' : 'Score'}</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-4">{es ? 'Robin %' : 'Robin %'}</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600 pr-4">{es ? 'Facial %' : 'Facial %'}</th>
                <th className="pb-2 text-[11px] font-medium text-slate-600">{es ? 'Voz %' : 'Voice %'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/20">
              {branchStats.map((b) => (
                <tr key={b.name} className="hover:bg-white/[0.015] transition-colors">
                  <td className="py-2 pr-4 text-slate-200 font-medium truncate max-w-[180px]">{b.name}</td>
                  <td className="py-2 pr-4 text-slate-400">{b.count}</td>
                  <td className="py-2 pr-4 text-slate-400">{b.activeUsers}</td>
                  <td className="py-2 pr-4">
                    <span className={cn('font-semibold',
                      b.avgScore >= 70 ? 'text-success' : b.avgScore >= 50 ? 'text-accent' : 'text-danger',
                    )}>
                      {b.avgScore}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-surface rounded-full">
                        <div className="h-full rounded-full bg-violet" style={{ width: `${b.avgRobin}%` }} />
                      </div>
                      <span className="text-xs text-slate-400">{b.avgRobin}%</span>
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-slate-400 text-xs">{b.avgFacial}%</td>
                  <td className="py-2 text-slate-400 text-xs">{b.avgVoice}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatMini({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>
  label: string; value: number; color: string
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Icon className={cn('w-3.5 h-3.5', color)} />
      <p className="text-sm font-bold text-slate-100">{value}</p>
      <p className="text-[10px] text-slate-600 text-center leading-tight">{label}</p>
    </div>
  )
}
