import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { ScoreBucket } from '../../lib/analytics'
import { PASS_THRESHOLD } from '../../lib/analytics'
import type { Language } from '../../store'

const BAR_COLOR = (bucket: ScoreBucket) => {
  if (bucket.max <= PASS_THRESHOLD) return '#EF4444'
  return '#3B82F6'
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: ScoreBucket }>
  language: Language
}

function CustomTooltip({ active, payload, language }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="tooltip-dark px-3 py-2.5">
      <p className="text-slate-400 text-xs mb-1">{d.payload.label}</p>
      <p className="text-slate-200 text-sm font-medium">
        {d.value} {language === 'es' ? 'simulaciones' : 'simulations'}
      </p>
    </div>
  )
}

interface Props {
  data: ScoreBucket[]
  language: Language
  height?: number
}

export function ScoreHistogram({ data, language, height = 200 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#475569' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#475569' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip language={language} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={BAR_COLOR(entry)} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
