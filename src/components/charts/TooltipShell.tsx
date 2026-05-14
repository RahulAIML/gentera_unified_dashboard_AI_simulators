import type { ReactNode, CSSProperties } from 'react'
import { useAppStore } from '../../store'

export interface TooltipColors {
  bg: string
  border: string
  shadow: string
  title: string
  label: string
  value: string
  accent: string
  success: string
  muted: string
  divider: string
}

export function useTooltipColors(): TooltipColors {
  const theme = useAppStore((s) => s.theme)
  const isDark = theme === 'dark'
  return isDark
    ? {
        bg:      '#0d1a2e',
        border:  'rgba(255,255,255,0.09)',
        shadow:  '0 8px 32px rgba(0,0,0,0.65), 0 2px 8px rgba(0,0,0,0.4)',
        title:   '#f1f5f9',
        label:   '#94a3b8',
        value:   '#e2e8f0',
        accent:  '#60a5fa',
        success: '#34d399',
        muted:   '#64748b',
        divider: 'rgba(255,255,255,0.07)',
      }
    : {
        bg:      '#ffffff',
        border:  'rgba(0,0,0,0.09)',
        shadow:  '0 4px 24px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.07)',
        title:   '#0f172a',
        label:   '#64748b',
        value:   '#1e293b',
        accent:  '#2563eb',
        success: '#059669',
        muted:   '#94a3b8',
        divider: 'rgba(0,0,0,0.07)',
      }
}

/* ── Presentational shell — receives colors as prop, NO hooks ── */

interface TooltipShellProps {
  children: ReactNode
  minWidth?: number
  c: TooltipColors
}

export function TooltipShell({ children, minWidth = 148, c }: TooltipShellProps) {
  const style: CSSProperties = {
    background:    c.bg,
    border:        `1px solid ${c.border}`,
    borderRadius:  10,
    boxShadow:     c.shadow,
    padding:       '10px 14px',
    minWidth,
    fontFamily:    'Inter, ui-sans-serif, system-ui, sans-serif',
    fontSize:      12,
    lineHeight:    1.5,
    pointerEvents: 'none',
  }
  return <div style={style}>{children}</div>
}

export function TRow({
  label,
  value,
  valueStyle,
  c,
}: {
  label: string
  value: string | number
  valueStyle?: CSSProperties
  c: TooltipColors
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginTop: 4 }}>
      <span style={{ color: c.label, fontSize: 11 }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: 12, ...valueStyle }}>{value}</span>
    </div>
  )
}

export function TTitle({ text, c }: { text: string; c: TooltipColors }) {
  return (
    <p style={{ color: c.title, fontWeight: 600, fontSize: 12, marginBottom: 6, marginTop: 0 }}>{text}</p>
  )
}

export function TDivider({ c }: { c: TooltipColors }) {
  return <div style={{ height: 1, background: c.divider, margin: '6px 0' }} />
}
