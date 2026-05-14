import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import type { ActivityStat } from '../../lib/analytics'
import type { Language } from '../../store'
import { useChartColors } from '../../lib/chartTheme'

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4', '#EF4444']

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: ActivityStat }>
  language: Language
}

function CustomTooltip({ active, payload, language }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="tooltip-dark px-3 py-2.5 min-w-[180px]">
      <p className="text-slate-200 text-xs font-medium mb-2 leading-relaxed">{d.name}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500 text-xs">{language === 'es' ? 'Sesiones' : 'Sessions'}</span>
          <span className="text-slate-200 text-xs font-medium">{d.count}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500 text-xs">{language === 'es' ? 'Prom. Puntaje' : 'Avg Score'}</span>
          <span className="text-accent text-xs font-medium">{d.avgScore}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500 text-xs">{language === 'es' ? 'Aprob.' : 'Pass Rate'}</span>
          <span className="text-success text-xs font-medium">{d.passRate}%</span>
        </div>
      </div>
    </div>
  )
}

interface Props {
  data: ActivityStat[]
  language: Language
  metric?: 'count' | 'avgScore' | 'passRate'
  height?: number
}

export function ActivityBar({ data, language, metric = 'avgScore', height = 200 }: Props) {
  const c = useChartColors()
  const label =
    metric === 'count'
      ? (language === 'es' ? 'Sesiones' : 'Sessions')
      : metric === 'avgScore'
      ? (language === 'es' ? 'Puntaje Promedio (%)' : 'Avg Score (%)')
      : (language === 'es' ? 'Tasa de Aprobación (%)' : 'Pass Rate (%)')

  const shortName = (name: string) => {
    if (name.length <= 18) return name
    return name.slice(0, 16) + '…'
  }

  const formatted = data.map((d) => ({
    ...d,
    shortName: shortName(d.name),
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={formatted}
        layout="vertical"
        margin={{ top: 4, right: 48, left: 8, bottom: 0 }}
        barCategoryGap="28%"
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          domain={metric === 'count' ? [0, 'dataMax'] : [0, 100]}
          tick={{ fontSize: 11, fill: c.tick }}
          axisLine={false}
          tickLine={false}
          tickFormatter={metric !== 'count' ? (v) => `${v}%` : undefined}
        />
        <YAxis
          type="category"
          dataKey="shortName"
          width={130}
          tick={{ fontSize: 11, fill: c.tick }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip language={language} />} cursor={{ fill: c.cursorFill }} />
        <Bar dataKey={metric} radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey={metric}
            position="right"
            formatter={(v: number) => metric !== 'count' ? `${v}%` : v}
            style={{ fill: c.labelList, fontSize: 11 }}
          />
          {formatted.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
