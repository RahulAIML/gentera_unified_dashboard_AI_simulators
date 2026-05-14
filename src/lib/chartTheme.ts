import { useAppStore } from '../store'

export interface ChartColors {
  tick: string
  tickMuted: string
  labelList: string
  cursorFill: string
  cursorStroke: string
  dotStroke: string
}

export function useChartColors(): ChartColors {
  const theme = useAppStore((s) => s.theme)
  const isDark = theme === 'dark'

  return {
    tick:         isDark ? '#94a3b8' : '#334155',
    tickMuted:    isDark ? '#64748b' : '#475569',
    labelList:    isDark ? '#64748b' : '#334155',
    cursorFill:   isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
    cursorStroke: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
    dotStroke:    isDark ? '#0C1628' : '#ffffff',
  }
}
