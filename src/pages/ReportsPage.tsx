import { useAppStore } from '../store'
import { useTranslation } from '../lib/i18n'
import { useDashboardData } from '../hooks/useDashboardData'
import { useFactRolPlayRub } from '../api/roleplayQueries'
import { FileDown, BarChart3, Mic2, Users, Activity } from 'lucide-react'


export default function ReportsPage() {
  const { language } = useAppStore()
  const t = useTranslation(language)
  const { kpis } = useDashboardData()
  const rpFact = useFactRolPlayRub()

  const simCount = kpis?.totalSimulations ?? 0
  const rpCount = rpFact.data?.length ?? 0

  function downloadCSV(rows: string[][], filename: string) {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportSimSummary() {
    downloadCSV(
      [
        [language === 'es' ? 'Métrica' : 'Metric', language === 'es' ? 'Valor' : 'Value'],
        [language === 'es' ? 'Total Simulaciones' : 'Total Simulations', String(simCount)],
        [language === 'es' ? 'Puntaje Promedio' : 'Average Score', String(kpis?.averageScore ?? 0) + '%'],
        [language === 'es' ? 'Tasa de Aprobación' : 'Pass Rate', String(kpis?.passRate ?? 0) + '%'],
        [language === 'es' ? 'Asesores Activos' : 'Active Advisors', String(kpis?.activeAdvisors ?? 0)],
        [language === 'es' ? 'Aprobados' : 'Passed', String(kpis?.passCount ?? 0)],
        [language === 'es' ? 'Reprobados' : 'Failed', String(kpis?.failCount ?? 0)],
      ],
      `gentera_simulator_summary_${new Date().toISOString().split('T')[0]}.csv`,
    )
  }

  function exportRpSummary() {
    const sessions = rpFact.data ?? []
    if (!sessions.length) return
    const rows: string[][] = [[
      'ID', 'Usuario', 'Administrador', 'Actividad', 'Fecha',
      'Puntos_Totales', 'Porcentaje_Robin', 'Porcentaje_Facial',
      'Porcentaje_Voz', 'Porcentaje_PPM', 'Num_MCs_Hechos',
    ]]
    sessions.forEach((s) => rows.push([
      String(s.ID_Ejercicio_Rub), s.Usuario_Nombre, s.Administrador_Nombre,
      s.Actividad_Rub_Nombre, s.Fecha, s.Puntos_Totales,
      s.Porcentaje_Robin, s.Porcentaje_Facial, s.Porcentaje_Voz,
      s.Porcentaje_Palabras_por_Minuto, String(s.Num_MCs_Hechos),
    ]))
    downloadCSV(rows, `gentera_roleplay_sessions_${new Date().toISOString().split('T')[0]}.csv`)
  }

  const es = language === 'es'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-50 tracking-tight">{t('page_reports_title')}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{t('page_reports_subtitle')}</p>
      </div>

      {/* Data summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: BarChart3, label: es ? 'Simulaciones' : 'Simulations', value: simCount.toLocaleString() },
          { icon: Mic2, label: es ? 'Sesiones Rolplay' : 'Rolplay Sessions', value: rpCount.toLocaleString() },
          { icon: Users, label: es ? 'Asesores Activos' : 'Active Advisors', value: String(kpis?.activeAdvisors ?? 0) },
          { icon: Activity, label: es ? 'Actividades' : 'Activities', value: String(kpis?.totalActivities ?? 0) },
        ].map((item) => (
          <div key={item.label} className="card p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <item.icon className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-lg font-bold text-slate-100">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Export cards */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-3">
          {es ? 'Exportar Datos' : 'Export Data'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={exportSimSummary}
            disabled={!simCount}
            className="card p-5 flex items-start gap-4 hover:border-accent/40 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <FileDown className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200 mb-1">
                {es ? 'Resumen Simulador' : 'Simulator Summary'}
              </p>
              <p className="text-xs text-slate-500">
                {es ? `KPIs agregados — ${simCount} simulaciones` : `Aggregated KPIs — ${simCount} simulations`}
              </p>
              <span className="inline-block mt-2 text-[10px] font-medium text-accent">CSV ↓</span>
            </div>
          </button>

          <button
            onClick={exportRpSummary}
            disabled={!rpCount}
            className="card p-5 flex items-start gap-4 hover:border-violet/40 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-xl bg-violet/10 flex items-center justify-center shrink-0">
              <FileDown className="w-5 h-5 text-violet" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200 mb-1">
                {es ? 'Sesiones Rolplay Completas' : 'Full Rolplay Sessions'}
              </p>
              <p className="text-xs text-slate-500">
                {es ? `Todas las sesiones con dimensiones IA — ${rpCount} registros` : `All sessions with AI dimensions — ${rpCount} records`}
              </p>
              <span className="inline-block mt-2 text-[10px] font-medium text-violet">CSV ↓</span>
            </div>
          </button>
        </div>
      </div>

    </div>
  )
}
