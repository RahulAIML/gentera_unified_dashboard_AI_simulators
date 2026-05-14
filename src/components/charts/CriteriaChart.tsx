import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import type { Language } from '../../store'
import { useChartColors } from '../../lib/chartTheme'
import { TooltipShell, TTitle, TRow, useTooltipColors, type TooltipColors } from './TooltipShell'
import type { CriterionStat } from '../../lib/roleplayAnalytics'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: CriterionStat }>
  language: Language
  c: TooltipColors
}

function CustomTooltip({ active, payload, language, c }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <TooltipShell minWidth={200} c={c}>
      <TTitle text={`MC ${d.payload.index}`} c={c} />
      <div style={{ color: c.label, fontSize: 11, marginBottom: 6, lineHeight: 1.4 }}>
        {d.payload.label}
      </div>
      <TRow
        label={language === 'es' ? '% Cumplido' : '% Met'}
        value={`${d.value}%`}
        valueStyle={{ color: d.value >= 70 ? c.success : d.value >= 40 ? c.accent : '#f87171' }}
        c={c}
      />
    </TooltipShell>
  )
}

interface Props {
  data: CriterionStat[]
  language: Language
  height?: number
}

export function CriteriaChart({ data, language, height = 280 }: Props) {
  const c = useChartColors()
  const tt = useTooltipColors()

  const shortened = data.map((d) => ({
    ...d,
    shortLabel: `MC ${d.index}`,
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={shortened} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barCategoryGap="25%">
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="shortLabel"
          tick={{ fontSize: 10, fill: c.tick }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: c.tick }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <ReferenceLine y={70} stroke="#10B981" strokeDasharray="4 4" strokeOpacity={0.5} />
        <Tooltip
          content={<CustomTooltip language={language} c={tt} />}
          cursor={{ fill: c.cursorFill }}
          wrapperStyle={{ zIndex: 50, outline: 'none' }}
        />
        <Bar dataKey="pctMet" radius={[4, 4, 0, 0]}>
          {shortened.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.pctMet >= 70 ? '#10B981' : entry.pctMet >= 40 ? '#3B82F6' : '#EF4444'}
              fillOpacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
