import { useDashboardData } from '../hooks/useDashboardData'
import { useAppStore } from '../store'
import { useTranslation } from '../lib/i18n'
import { Trophy, Medal, TrendingUp, TrendingDown } from 'lucide-react'

export default function LeaderboardPage() {
  const { language } = useAppStore()
  const t = useTranslation(language)
  const { isLoading, isError, userStats, refetch } = useDashboardData()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 skeleton rounded-lg" />
        <div className="card p-5 h-96 skeleton rounded-xl" />
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

  const rows = userStats ?? []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-50 tracking-tight">{t('page_leader_title')}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{t('page_leader_subtitle')}</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line/40">
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-12">{t('col_rank')}</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('col_advisor')}</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">{t('col_simulations')}</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">{t('col_avg_score')}</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">{t('col_pass_rate')}</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">{t('col_best')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u, i) => (
                <tr key={u.name} className="border-b border-line/20 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <RankBadge rank={i} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-200 font-medium">{u.name}</span>
                      {i === 0 && <Trophy className="w-3.5 h-3.5 text-yellow-500" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400">{u.count}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {u.avgScore >= 60 ? <TrendingUp className="w-3 h-3 text-success" /> : <TrendingDown className="w-3 h-3 text-danger" />}
                      <span className={`font-semibold ${u.avgScore >= 60 ? 'text-success' : 'text-danger'}`}>{u.avgScore}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400">{u.passRate}%</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-200">{u.bestScore}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-sm">{t('no_data')}</div>
        )}
      </div>
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 0) {
    return (
      <div className="w-7 h-7 rounded-full bg-yellow-500/15 flex items-center justify-center">
        <Medal className="w-3.5 h-3.5 text-yellow-500" />
      </div>
    )
  }
  if (rank === 1) {
    return (
      <div className="w-7 h-7 rounded-full bg-slate-400/15 flex items-center justify-center text-xs font-bold text-slate-300">
        2
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="w-7 h-7 rounded-full bg-orange-500/15 flex items-center justify-center text-xs font-bold text-orange-400">
        3
      </div>
    )
  }
  return (
    <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-xs font-medium text-slate-600">
      {rank + 1}
    </div>
  )
}
