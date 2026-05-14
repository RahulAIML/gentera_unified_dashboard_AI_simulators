import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Language } from '../../store'
import { useChartColors } from '../../lib/chartTheme'
import { TooltipShell, TRow, useTooltipColors, type TooltipColors } from './TooltipShell'
import type { ScoreDimension } from '../../lib/roleplayAnalytics'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: ScoreDimension }>
  language: Language
  c: TooltipColors
}

function CustomTooltip({ active, payload, language, c }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <TooltipShell minWidth={148} c={c}>
      <TRow
        label={d.payload.label}
        value={`${d.value}%`}
        valueStyle={{ color: c.accent }}
        c={c}
      />
    </TooltipShell>
  )
}

interface Props {
  data: ScoreDimension[]
  language: Language
  height?: number
}

export function ScoreDimensionRadar({ data, language, height = 260 }: Props) {
  const c = useChartColors()
  const tt = useTooltipColors()

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <defs>
          <linearGradient id="rpRadarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <PolarGrid stroke={c.tick} strokeOpacity={0.3} />
        <PolarAngleAxis dataKey="label" tick={{ fontSize: 11, fill: c.tick }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: c.tick }} tickCount={5} />
        <Tooltip
          content={<CustomTooltip language={language} c={tt} />}
          wrapperStyle={{ zIndex: 50, outline: 'none' }}
        />
        <Radar
          name={language === 'es' ? 'Promedio' : 'Average'}
          dataKey="avg"
          stroke="#8B5CF6"
          strokeWidth={2}
          fill="url(#rpRadarGrad)"
          dot={{ fill: '#8B5CF6', strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6, fill: '#8B5CF6', stroke: c.dotStroke, strokeWidth: 2 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
