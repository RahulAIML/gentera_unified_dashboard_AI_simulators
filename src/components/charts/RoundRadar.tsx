import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { RoundStat } from '../../lib/analytics'
import type { Language } from '../../store'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: RoundStat }>
  language: Language
}

function CustomTooltip({ active, payload, language }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="tooltip-dark px-3 py-2.5">
      <p className="text-slate-400 text-xs mb-1">
        {language === 'es' ? 'Ronda' : 'Round'} {d.payload.round}
      </p>
      <p className="text-accent text-sm font-medium">{d.value.toFixed(2)}</p>
      <p className="text-slate-500 text-xs">{d.payload.count} {language === 'es' ? 'sesiones' : 'sessions'}</p>
    </div>
  )
}

interface Props {
  data: RoundStat[]
  language: Language
  height?: number
}

export function RoundRadar({ data, language, height = 260 }: Props) {
  const radarData = data.map((d) => ({
    ...d,
    fullMark: 1,
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <defs>
          <linearGradient id="radarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <PolarGrid />
        <PolarAngleAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#64748b' }}
        />
        <Tooltip content={<CustomTooltip language={language} />} />
        <Radar
          name={language === 'es' ? 'Promedio' : 'Average'}
          dataKey="avg"
          stroke="#3B82F6"
          strokeWidth={2}
          fill="url(#radarGrad)"
          dot={{ fill: '#3B82F6', strokeWidth: 0, r: 3 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
