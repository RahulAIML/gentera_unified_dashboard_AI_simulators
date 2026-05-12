import { useDashboardData } from '../hooks/useDashboardData'
import { useAppStore } from '../store'
import { useTranslation } from '../lib/i18n'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { MessageSquare, Brain } from 'lucide-react'

export default function ConversationalPage() {
  const { language } = useAppStore()
  const t = useTranslation(language)
  const { isLoading, isError, roundStats, feedback, refetch } = useDashboardData()

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

  const radarData = (roundStats ?? []).map((r) => ({
    round: `${t('round')} ${r.round}`,
    avg: r.avg,
    passRate: r.passRate,
  }))

  const recentFeedback = (feedback ?? []).slice(0, 8)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50 tracking-tight">{t('page_conv_title')}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{t('page_conv_subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Radar */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-slate-200">{t('round_performance')}</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="round" />
                <PolarRadiusAxis domain={[0, 100]} tickCount={5} />
                <Radar name="Avg" dataKey="avg" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.25} strokeWidth={2} />
                <Radar name="Pass Rate" dataKey="passRate" stroke="#10B981" fill="#10B981" fillOpacity={0.15} strokeWidth={2} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1A2D45', borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-violet" />
            <h3 className="text-sm font-semibold text-slate-200">{t('round_performance')}</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={radarData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="round" />
                <YAxis domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1A2D45', borderRadius: 8 }} />
                <Bar dataKey="avg" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="passRate" fill="#10B981" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Feedback */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">{t('coaching_feedback')}</h3>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {recentFeedback.map((f, i) => (
            <div key={i} className="p-3 rounded-lg bg-surface border border-line/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">{f.userName}</span>
                  <span className="text-[10px] text-slate-600 bg-card px-1.5 py-0.5 rounded">{t('round')} {f.round}</span>
                </div>
                <span className={`text-xs font-bold ${f.points > 0 ? 'text-success' : 'text-danger'}`}>{f.points} {t('points')}</span>
              </div>
              <p className="text-xs text-slate-500 mb-1">{f.question}</p>
              <p className="text-xs text-slate-400 mb-1.5 italic">"{f.response}"</p>
              <p className="text-[11px] text-slate-600 bg-card rounded px-2 py-1.5 border border-line/20">{f.feedback}</p>
            </div>
          ))}
          {recentFeedback.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-8">{t('no_data')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
