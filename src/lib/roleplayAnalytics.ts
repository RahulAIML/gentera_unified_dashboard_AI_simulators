import type {
  RpFactSession,
  RpSupervisor,
  RpAdministrador,
  RpUsuario,
  RpActividadRub,
  SuperUser,
  SuperAdmin,
} from '../api/roleplayTypes'

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function pct(part: number, total: number): number {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

function parseScore(v: string | number | undefined | null): number {
  if (v === null || v === undefined || v === '') return 0
  const n = parseFloat(String(v))
  return isNaN(n) ? 0 : n
}

// Roleplay dates: "DD/MM/YYYY HH:MM:SS" or "DD/MM/YYYY"
export function parseRpDate(raw: string): Date | null {
  try {
    const [datePart] = raw.split(' ')
    const [dd, mm, yyyy] = datePart.split('/')
    return new Date(`${yyyy}-${mm}-${dd}`)
  } catch {
    return null
  }
}

// Returns "YYYY-MM-DD" for grouping
function toIsoDate(raw: string): string {
  const d = parseRpDate(raw)
  if (!d || isNaN(d.getTime())) return 'unknown'
  return d.toISOString().split('T')[0]
}

// ─────────────────────────────────────────────
// KPIs
// ─────────────────────────────────────────────

export interface RoleplayKPIs {
  totalSessions: number
  avgTotalScore: number         // avg of Puntos_Totales (0-100)
  avgRobinPct: number           // avg Porcentaje_Robin
  avgFacialPct: number
  avgVoicePct: number
  avgWpmPct: number
  avgCriteriaRate: number       // avg % criteria met
  activeUsers: number
  activeBranches: number
  totalActivities: number
  avgRecordingAttempts: number
  avgVideoDuration: number      // seconds
}

export function computeRpKPIs(
  sessions: RpFactSession[],
  actividades: RpActividadRub[],
): RoleplayKPIs {
  if (!sessions.length) {
    return {
      totalSessions: 0, avgTotalScore: 0, avgRobinPct: 0, avgFacialPct: 0,
      avgVoicePct: 0, avgWpmPct: 0, avgCriteriaRate: 0, activeUsers: 0,
      activeBranches: 0, totalActivities: actividades.length, avgRecordingAttempts: 0,
      avgVideoDuration: 0,
    }
  }

  // Build MC count lookup per activity name
  const actMcCount = new Map<string, number>()
  actividades.forEach((a) => {
    actMcCount.set(a.Actividad_Rub_Nombre, a.Numero_MC)
  })

  const criteriaRates: number[] = []
  sessions.forEach((s) => {
    const maxMC = actMcCount.get(s.Actividad_Rub_Nombre) ?? 0
    if (maxMC > 0) {
      criteriaRates.push((s.Num_MCs_Hechos / maxMC) * 100)
    }
  })

  const totals = sessions.map((s) => parseScore(s.Puntos_Totales))
  const robinPcts = sessions.map((s) => parseScore(s.Porcentaje_Robin))
  const facialPcts = sessions.map((s) => parseScore(s.Porcentaje_Facial))
  const voicePcts = sessions.map((s) => parseScore(s.Porcentaje_Voz))
  const wpmPcts = sessions.map((s) => parseScore(s.Porcentaje_Palabras_por_Minuto))
  const durations = sessions.map((s) => parseScore(s.Duracion_del_Video))
  const attempts = sessions.map((s) => s.Grabaciones_Totales ?? 0)

  const activitySet = new Set(sessions.map((s) => s.Actividad_Rub_Nombre))
  const branchSet = new Set(sessions.map((s) => s.Administrador_Nombre))
  const userSet = new Set(sessions.map((s) => s.ID_Usuario))

  return {
    totalSessions: sessions.length,
    avgTotalScore: Math.round(avg(totals)),
    avgRobinPct: Math.round(avg(robinPcts)),
    avgFacialPct: Math.round(avg(facialPcts)),
    avgVoicePct: Math.round(avg(voicePcts)),
    avgWpmPct: Math.round(avg(wpmPcts)),
    avgCriteriaRate: criteriaRates.length ? Math.round(avg(criteriaRates)) : 0,
    activeUsers: userSet.size,
    activeBranches: branchSet.size,
    totalActivities: activitySet.size,
    avgRecordingAttempts: Math.round(avg(attempts) * 10) / 10,
    avgVideoDuration: Math.round(avg(durations)),
  }
}

// ─────────────────────────────────────────────
// Score Trend over time
// ─────────────────────────────────────────────

export interface RpTrendPoint {
  date: string          // ISO YYYY-MM-DD
  label: string         // display label
  avgScore: number
  avgRobin: number
  count: number
}

export function computeRpTrend(sessions: RpFactSession[]): RpTrendPoint[] {
  const byDate: Record<string, RpFactSession[]> = {}
  sessions.forEach((s) => {
    const key = toIsoDate(s.Fecha_y_Hora)
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(s)
  })
  return Object.entries(byDate)
    .filter(([k]) => k !== 'unknown')
    .map(([date, group]) => ({
      date,
      label: date.slice(5), // MM-DD
      avgScore: Math.round(avg(group.map((s) => parseScore(s.Puntos_Totales)))),
      avgRobin: Math.round(avg(group.map((s) => parseScore(s.Porcentaje_Robin)))),
      count: group.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// ─────────────────────────────────────────────
// Score Dimensions (for radar chart)
// ─────────────────────────────────────────────

export interface ScoreDimension {
  dimension: string
  label: string
  avg: number
  fullMark: number
}

export function computeScoreDimensions(sessions: RpFactSession[], language: 'es' | 'en'): ScoreDimension[] {
  if (!sessions.length) return []
  const labels = language === 'es'
    ? { robin: 'IA (Robin)', facial: 'Expresión Facial', voice: 'Voz', wpm: 'Palabras/Min' }
    : { robin: 'AI (Robin)', facial: 'Facial Expr.', voice: 'Voice', wpm: 'Words/Min' }
  return [
    { dimension: 'robin', label: labels.robin, avg: Math.round(avg(sessions.map((s) => parseScore(s.Porcentaje_Robin)))), fullMark: 100 },
    { dimension: 'facial', label: labels.facial, avg: Math.round(avg(sessions.map((s) => parseScore(s.Porcentaje_Facial)))), fullMark: 100 },
    { dimension: 'voice', label: labels.voice, avg: Math.round(avg(sessions.map((s) => parseScore(s.Porcentaje_Voz)))), fullMark: 100 },
    { dimension: 'wpm', label: labels.wpm, avg: Math.round(avg(sessions.map((s) => parseScore(s.Porcentaje_Palabras_por_Minuto)))), fullMark: 100 },
  ]
}

// ─────────────────────────────────────────────
// Activity breakdown
// ─────────────────────────────────────────────

export interface RpActivityStat {
  name: string
  count: number
  avgScore: number
  avgRobin: number
  avgCriteria: number
  avgAttempts: number
}

export function computeRpActivityStats(
  sessions: RpFactSession[],
  actividades: RpActividadRub[],
): RpActivityStat[] {
  const actMcCount = new Map<string, number>()
  actividades.forEach((a) => actMcCount.set(a.Actividad_Rub_Nombre, a.Numero_MC))

  const byActivity: Record<string, RpFactSession[]> = {}
  sessions.forEach((s) => {
    if (!byActivity[s.Actividad_Rub_Nombre]) byActivity[s.Actividad_Rub_Nombre] = []
    byActivity[s.Actividad_Rub_Nombre].push(s)
  })

  return Object.entries(byActivity)
    .map(([name, group]) => {
      const maxMC = actMcCount.get(name) ?? 0
      const criteriaRates = maxMC > 0
        ? group.map((s) => (s.Num_MCs_Hechos / maxMC) * 100)
        : []
      return {
        name,
        count: group.length,
        avgScore: Math.round(avg(group.map((s) => parseScore(s.Puntos_Totales)))),
        avgRobin: Math.round(avg(group.map((s) => parseScore(s.Porcentaje_Robin)))),
        avgCriteria: criteriaRates.length ? Math.round(avg(criteriaRates)) : 0,
        avgAttempts: Math.round(avg(group.map((s) => s.Grabaciones_Totales ?? 0)) * 10) / 10,
      }
    })
    .sort((a, b) => b.count - a.count)
}

// ─────────────────────────────────────────────
// User (advisor) statistics
// ─────────────────────────────────────────────

export interface RpUserStat {
  userId: number
  name: string
  branch: string
  count: number
  avgScore: number
  avgRobin: number
  avgCriteria: number
  bestScore: number
}

export function computeRpUserStats(sessions: RpFactSession[]): RpUserStat[] {
  const byUser: Record<number, RpFactSession[]> = {}
  sessions.forEach((s) => {
    if (!byUser[s.ID_Usuario]) byUser[s.ID_Usuario] = []
    byUser[s.ID_Usuario].push(s)
  })

  return Object.entries(byUser)
    .map(([id, group]) => {
      const totals = group.map((s) => parseScore(s.Puntos_Totales))
      return {
        userId: Number(id),
        name: group[0].Usuario_Nombre,
        branch: group[0].Administrador_Nombre,
        count: group.length,
        avgScore: Math.round(avg(totals)),
        avgRobin: Math.round(avg(group.map((s) => parseScore(s.Porcentaje_Robin)))),
        avgCriteria: group.length ? Math.round(avg(group.map((s) => s.Num_MCs_Hechos))) : 0,
        bestScore: Math.round(Math.max(...totals)),
      }
    })
    .sort((a, b) => b.avgScore - a.avgScore)
}

// ─────────────────────────────────────────────
// Branch (Administrador) analytics
// ─────────────────────────────────────────────

export interface RpBranchStat {
  name: string
  count: number
  avgScore: number
  avgRobin: number
  activeUsers: number
}

export function computeRpBranchStats(sessions: RpFactSession[]): RpBranchStat[] {
  const byBranch: Record<string, RpFactSession[]> = {}
  sessions.forEach((s) => {
    if (!byBranch[s.Administrador_Nombre]) byBranch[s.Administrador_Nombre] = []
    byBranch[s.Administrador_Nombre].push(s)
  })

  return Object.entries(byBranch)
    .map(([name, group]) => ({
      name,
      count: group.length,
      avgScore: Math.round(avg(group.map((s) => parseScore(s.Puntos_Totales)))),
      avgRobin: Math.round(avg(group.map((s) => parseScore(s.Porcentaje_Robin)))),
      activeUsers: new Set(group.map((s) => s.ID_Usuario)).size,
    }))
    .sort((a, b) => b.count - a.count)
}

// ─────────────────────────────────────────────
// Supervisor analytics (via bridge tables)
// ─────────────────────────────────────────────

export interface RpSupervisorStat {
  supervisorKey: number
  name: string
  email: string
  userCount: number
  sessionCount: number
  avgScore: number
  avgRobin: number
  activeBranches: number
}

export function computeRpSupervisorStats(
  supervisores: RpSupervisor[],
  superUser: SuperUser[],
  usuarios: RpUsuario[],
  sessions: RpFactSession[],
): RpSupervisorStat[] {
  // Build: supervisorKey → set of usuario_keys
  const supUserMap = new Map<number, Set<number>>()
  superUser.forEach(({ Supervisor_Key, Usuario_Key }) => {
    if (!supUserMap.has(Supervisor_Key)) supUserMap.set(Supervisor_Key, new Set())
    supUserMap.get(Supervisor_Key)!.add(Usuario_Key)
  })

  // Build: usuario_key → ID_Usuario (they're equal per schema, but be explicit)
  const usuarioKeyToId = new Map<number, number>()
  usuarios.forEach((u) => usuarioKeyToId.set(u.Usuario_Key, u.ID_Usuario))

  // Build: ID_Usuario → sessions
  const sessionsByUser = new Map<number, RpFactSession[]>()
  sessions.forEach((s) => {
    if (!sessionsByUser.has(s.ID_Usuario)) sessionsByUser.set(s.ID_Usuario, [])
    sessionsByUser.get(s.ID_Usuario)!.push(s)
  })

  return supervisores.map((sup) => {
    const userKeys = supUserMap.get(sup.Supervisor_Key) ?? new Set<number>()
    const supervisedSessions: RpFactSession[] = []
    userKeys.forEach((uk) => {
      const uid = usuarioKeyToId.get(uk) ?? uk
      const userSessions = sessionsByUser.get(uid) ?? []
      supervisedSessions.push(...userSessions)
    })

    const branchSet = new Set(supervisedSessions.map((s) => s.Administrador_Nombre))

    return {
      supervisorKey: sup.Supervisor_Key,
      name: sup['Supervisor Nombre'],
      email: sup['Supervisor Email'],
      userCount: userKeys.size,
      sessionCount: supervisedSessions.length,
      avgScore: supervisedSessions.length
        ? Math.round(avg(supervisedSessions.map((s) => parseScore(s.Puntos_Totales))))
        : 0,
      avgRobin: supervisedSessions.length
        ? Math.round(avg(supervisedSessions.map((s) => parseScore(s.Porcentaje_Robin))))
        : 0,
      activeBranches: branchSet.size,
    }
  }).sort((a, b) => b.sessionCount - a.sessionCount)
}

// ─────────────────────────────────────────────
// Criteria fulfillment (which MC criteria pass most/least)
// ─────────────────────────────────────────────

export interface CriterionStat {
  index: number
  label: string
  pctMet: number
  count: number
}

export function computeCriteriaStats(
  sessions: RpFactSession[],
  activityName: string | null,
  actividades: RpActividadRub[],
): CriterionStat[] {
  const filtered = activityName
    ? sessions.filter((s) => s.Actividad_Rub_Nombre === activityName)
    : sessions

  if (!filtered.length) return []

  const actDef = actividades.find((a) =>
    activityName ? a.Actividad_Rub_Nombre === activityName : true,
  )

  return Array.from({ length: 20 }, (_, i) => {
    const key = `MC_${i + 1}_Hecho` as keyof RpFactSession
    const labelKey = `MC_${i + 1}` as keyof RpActividadRub
    const label = actDef?.[labelKey] as string | undefined
    if (!label || label === 'No aplica') return null

    const met = filtered.filter((s) => {
      const v = s[key]
      return v === 1 || v === true || v === '1'
    }).length

    return {
      index: i + 1,
      label,
      pctMet: pct(met, filtered.length),
      count: filtered.length,
    }
  }).filter((x): x is CriterionStat => x !== null)
}

// ─────────────────────────────────────────────
// Score distribution for roleplay
// ─────────────────────────────────────────────

export interface RpScoreBucket {
  label: string
  count: number
  min: number
  max: number
}

export function computeRpScoreDistribution(sessions: RpFactSession[]): RpScoreBucket[] {
  const buckets: RpScoreBucket[] = [
    { label: '0–20', min: 0, max: 20, count: 0 },
    { label: '21–40', min: 21, max: 40, count: 0 },
    { label: '41–60', min: 41, max: 60, count: 0 },
    { label: '61–80', min: 61, max: 80, count: 0 },
    { label: '81–100', min: 81, max: 100, count: 0 },
  ]
  sessions.forEach((s) => {
    const score = parseScore(s.Puntos_Totales)
    const b = buckets.find((bk) => score >= bk.min && score <= bk.max)
    if (b) b.count++
  })
  return buckets
}
