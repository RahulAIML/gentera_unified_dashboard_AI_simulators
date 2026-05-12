import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { Language } from '../../store'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number }>
  language: Language
}

function CustomTooltip({ active, payload, language }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="tooltip-dark px-3 py-2.5">
      <p className="text-slate-300 text-xs">
        {payload[0].name}: <span className="font-semibold">{payload[0].value}</span>
      </p>
    </div>
  )
}

interface Props {
  pass: number
  fail: number
  language: Language
  size?: number
}

export function PassFailDonut({ pass, fail, language, size = 180 }: Props) {
  const total = pass + fail
  const rate = total ? Math.round((pass / total) * 100) : 0
  const passLabel = language === 'es' ? 'Aprobado' : 'Passed'
  const failLabel = language === 'es' ? 'Reprobado' : 'Failed'

  const data = [
    { name: passLabel, value: pass },
    { name: failLabel, value: fail },
  ]

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={size * 0.33}
              outerRadius={size * 0.45}
              startAngle={90}
              endAngle={-270}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              <Cell fill="#10B981" />
              <Cell fill="#EF4444" />
            </Pie>
            <Tooltip content={<CustomTooltip language={language} />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-50">{rate}%</span>
          <span className="text-xs text-slate-600">{passLabel}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="text-slate-400">{passLabel}</span>
          <span className="text-slate-200 font-medium">{pass}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-danger" />
          <span className="text-slate-400">{failLabel}</span>
          <span className="text-slate-200 font-medium">{fail}</span>
        </div>
      </div>
    </div>
  )
}
