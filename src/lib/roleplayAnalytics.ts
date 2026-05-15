import type {
  RpFactSession,
  RpSupervisor,
  RpUsuario,
  RpActividadRub,
  SuperUser,
  SuperAdmin,
  SuperActRub,
  AdminActRub,
  UserActRub,
  MCValue,
} from '../api/roleplayTypes'

// ─────────────────────────────────────────────
// Primitive helpers
// ─────────────────────────────────────────────

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function pct(part: number, total: number): number {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

export function parseScore(v: string | number | undefined | null): number {
  if (v === null || v === undefined || v === '') return 0
  const n = parseFloat(String(v))
  return isNaN(n) ? 0 : n
}

/**
 * Parse a percentage field from the API and cap at 100.
 * The rolplay.net backend pre-computes Porcentaje_Robin = (Puntos_Robin / Puntos_Maximos_Robin) × 100
 * but the Robin AI can award more raw points than Puntos_Maximos_Robin, producing values like 111.
 * We cap at 100 for all display purposes.
 */
function parsePct(v: string | number | undefined | null): number {
  return Math.min(100, parseScore(v))
}

// MC field value: 1 / true / "1" = done; anything else (0, null, "No aplica") = not done
function isMCDone(v: MCValue): boolean {
  return v === 1 || v === '1'
}

// Count how many applicable MC criteria were met in a session
function countMCDone(s: RpFactSession, numMC: number): number {
  let done = 0
  for (let i = 1; i <= numMC; i++) {
    const key = `MC_${i}_Hecho` as keyof RpFactSession
    if (isMCDone(s[key] as MCValue)) done++
  }
  return done
}

// Num_MCs_Hechos is a string in the API ("0", "3", …)
function numMCsDone(s: RpFactSession): number {
  return parseScore(s.Num_MCs_Hechos)
}

// Roleplay dates: "DD/MM/YYYY HH:MM:SS" or "DD/MM/YYYY"
export function parseRpDate(raw: string): Date | null {
  try {
    if (!raw) return null
    const [datePart] = raw.split(' ')
    const [dd, mm, yyyy] = datePart.split('/')
    const d = new Date(`${yyyy}-${mm}-${dd}`)
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

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
  avgTotalScore: number
  avgRobinPct: number
  avgFacialPct: number
  avgVoicePct: number
  avgWpmPct: number
  avgCriteriaRate: number       // avg % MC criteria met (only sessions with MC active)
  activeUsers: number
  activeBranches: number
  totalActivities: number
  avgRecordingAttempts: number
  avgVideoDuration: number      // seconds
  totalMCPoints: number         // sum of all MC criteria met across all sessions
}

export function computeRpKPIs(
  sessions: RpFactSession[],
  actividades: RpActividadRub[],
): RoleplayKPIs {
  if (!sessions.length) {
    return {
      totalSessions: 0, avgTotalScore: 0, avgRobinPct: 0, avgFacialPct: 0,
      avgVoicePct: 0, avgWpmPct: 0, avgCriteriaRate: 0, activeUsers: 0,
      activeBranches: 0, totalActivities: 0, avgRecordingAttempts: 0,
      avgVideoDuration: 0, totalMCPoints: 0,
    }
  }

  const actMap = new Map<string, RpActividadRub>()
  actividades.forEach((a) => actMap.set(a.Actividad_Rub_Nombre, a))

  const criteriaRates: number[] = []
  let totalMCPoints = 0

  sessions.forEach((s) => {
    const act = actMap.get(s.Actividad_Rub_Nombre)
    const maxMC = act?.Numero_MC ?? 0
    if (maxMC > 0) {
      const done = countMCDone(s, maxMC)
      criteriaRates.push(pct(done, maxMC))
      totalMCPoints += done * (act?.Puntos_por_MC ?? 0)
    }
  })

  return {
    totalSessions: sessions.length,
    avgTotalScore: Math.round(avg(sessions.map((s) => parseScore(s.Puntos_Totales)))),
    avgRobinPct:   Math.round(avg(sessions.map((s) => parsePct(s.Porcentaje_Robin)))),
    avgFacialPct:  Math.round(avg(sessions.map((s) => parsePct(s.Porcentaje_Facial)))),
    avgVoicePct:   Math.round(avg(sessions.map((s) => parsePct(s.Porcentaje_Voz)))),
    avgWpmPct:     Math.round(avg(sessions.map((s) => parsePct(s.Porcentaje_Palabras_por_Minuto)))),
    avgCriteriaRate: criteriaRates.length ? Math.round(avg(criteriaRates)) : 0,
    activeUsers:    new Set(sessions.map((s) => s.ID_Usuario)).size,
    activeBranches: new Set(sessions.map((s) => s.Administrador_Nombre)).size,
    totalActivities: new Set(sessions.map((s) => s.Actividad_Rub_Nombre)).size,
    avgRecordingAttempts: Math.round(avg(sessions.map((s) => s.Grabaciones_Totales ?? 0)) * 10) / 10,
    avgVideoDuration: Math.round(avg(sessions.map((s) => parseScore(s.Duracion_del_Video)))),
    totalMCPoints,
  }
}

// ─────────────────────────────────────────────
// Score Trend
// ─────────────────────────────────────────────

export interface RpTrendPoint {
  date: string
  label: string
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
      label: date.slice(5),
      avgScore: Math.round(avg(group.map((s) => parseScore(s.Puntos_Totales)))),
      avgRobin: Math.round(avg(group.map((s) => parsePct(s.Porcentaje_Robin)))),
      count: group.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// ─────────────────────────────────────────────
// Score Dimensions (Radar)
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
    { dimension: 'robin',  label: labels.robin,  avg: Math.round(avg(sessions.map((s) => parsePct(s.Porcentaje_Robin)))),                  fullMark: 100 },
    { dimension: 'facial', label: labels.facial, avg: Math.round(avg(sessions.map((s) => parsePct(s.Porcentaje_Facial)))),                 fullMark: 100 },
    { dimension: 'voice',  label: labels.voice,  avg: Math.round(avg(sessions.map((s) => parsePct(s.Porcentaje_Voz)))),                    fullMark: 100 },
    { dimension: 'wpm',    label: labels.wpm,    avg: Math.round(avg(sessions.map((s) => parsePct(s.Porcentaje_Palabras_por_Minuto)))), fullMark: 100 },
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
  maxScore: number
  assignedBranches: number  // how many branches ran this activity
}

export function computeRpActivityStats(
  sessions: RpFactSession[],
  actividades: RpActividadRub[],
): RpActivityStat[] {
  const actMap = new Map<string, RpActividadRub>()
  actividades.forEach((a) => actMap.set(a.Actividad_Rub_Nombre, a))

  const byActivity: Record<string, RpFactSession[]> = {}
  sessions.forEach((s) => {
    if (!byActivity[s.Actividad_Rub_Nombre]) byActivity[s.Actividad_Rub_Nombre] = []
    byActivity[s.Actividad_Rub_Nombre].push(s)
  })

  return Object.entries(byActivity)
    .map(([name, group]) => {
      const act = actMap.get(name)
      const maxMC = act?.Numero_MC ?? 0
      const criteriaRates = maxMC > 0
        ? group.map((s) => pct(countMCDone(s, maxMC), maxMC))
        : []
      const totals = group.map((s) => parseScore(s.Puntos_Totales))
      return {
        name,
        count: group.length,
        avgScore: Math.round(avg(totals)),
        avgRobin: Math.round(avg(group.map((s) => parsePct(s.Porcentaje_Robin)))),
        avgCriteria: criteriaRates.length ? Math.round(avg(criteriaRates)) : 0,
        avgAttempts: Math.round(avg(group.map((s) => s.Grabaciones_Totales ?? 0)) * 10) / 10,
        maxScore: Math.round(Math.max(...totals)),
        assignedBranches: new Set(group.map((s) => s.Administrador_Nombre)).size,
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
  avgAttempts: number
  assignedActivities: number   // from User_Act_Rub
}

export function computeRpUserStats(
  sessions: RpFactSession[],
  actividades: RpActividadRub[],
  userActRub: UserActRub[],
): RpUserStat[] {
  const actMap = new Map<string, RpActividadRub>()
  actividades.forEach((a) => actMap.set(a.Actividad_Rub_Nombre, a))

  // User_Act_Rub: count assigned activities per user key
  const assignedByUserKey = new Map<number, number>()
  userActRub.forEach(({ Usuario_Key }) => {
    assignedByUserKey.set(Usuario_Key, (assignedByUserKey.get(Usuario_Key) ?? 0) + 1)
  })

  const byUser: Record<number, RpFactSession[]> = {}
  sessions.forEach((s) => {
    if (!byUser[s.ID_Usuario]) byUser[s.ID_Usuario] = []
    byUser[s.ID_Usuario].push(s)
  })

  return Object.entries(byUser)
    .map(([id, group]) => {
      const totals = group.map((s) => parseScore(s.Puntos_Totales))
      const criteriaRates: number[] = []
      group.forEach((s) => {
        const act = actMap.get(s.Actividad_Rub_Nombre)
        const maxMC = act?.Numero_MC ?? 0
        if (maxMC > 0) criteriaRates.push(pct(countMCDone(s, maxMC), maxMC))
      })
      return {
        userId: Number(id),
        name: group[0].Usuario_Nombre,
        branch: group[0].Administrador_Nombre,
        count: group.length,
        avgScore: Math.round(avg(totals)),
        avgRobin: Math.round(avg(group.map((s) => parsePct(s.Porcentaje_Robin)))),
        avgCriteria: criteriaRates.length ? Math.round(avg(criteriaRates)) : 0,
        bestScore: Math.round(Math.max(...totals)),
        avgAttempts: Math.round(avg(group.map((s) => s.Grabaciones_Totales ?? 0)) * 10) / 10,
        assignedActivities: assignedByUserKey.get(Number(id)) ?? 0,
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
  avgFacial: number
  avgVoice: number
  avgWpm: number
  activeUsers: number
  activitiesRun: number
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
      avgScore:  Math.round(avg(group.map((s) => parseScore(s.Puntos_Totales)))),
      avgRobin:  Math.round(avg(group.map((s) => parsePct(s.Porcentaje_Robin)))),
      avgFacial: Math.round(avg(group.map((s) => parsePct(s.Porcentaje_Facial)))),
      avgVoice:  Math.round(avg(group.map((s) => parsePct(s.Porcentaje_Voz)))),
      avgWpm:    Math.round(avg(group.map((s) => parsePct(s.Porcentaje_Palabras_por_Minuto)))),
      activeUsers: new Set(group.map((s) => s.ID_Usuario)).size,
      activitiesRun: new Set(group.map((s) => s.Actividad_Rub_Nombre)).size,
    }))
    .sort((a, b) => b.count - a.count)
}

// ─────────────────────────────────────────────
// Supervisor analytics (bridge tables)
// ─────────────────────────────────────────────

export interface RpSupervisorStat {
  supervisorKey: number
  name: string
  email: string
  userCount: number
  adminCount: number       // branches under this supervisor
  sessionCount: number
  avgScore: number
  avgRobin: number
  activeBranches: number
  activityKeys: number[]   // from Super_Act_Rub
}

export function computeRpSupervisorStats(
  supervisores: RpSupervisor[],
  superUser: SuperUser[],
  superAdmin: SuperAdmin[],
  superActRub: SuperActRub[],
  sessions: RpFactSession[],
): RpSupervisorStat[] {
  // supervisor → set of user keys
  const supUserMap = new Map<number, Set<number>>()
  superUser.forEach(({ Supervisor_Key, Usuario_Key }) => {
    if (!supUserMap.has(Supervisor_Key)) supUserMap.set(Supervisor_Key, new Set())
    supUserMap.get(Supervisor_Key)!.add(Usuario_Key)
  })

  // supervisor → set of admin (branch) keys
  const supAdminMap = new Map<number, Set<number>>()
  superAdmin.forEach(({ Supervisor_Key, Administrador_Key }) => {
    if (!supAdminMap.has(Supervisor_Key)) supAdminMap.set(Supervisor_Key, new Set())
    supAdminMap.get(Supervisor_Key)!.add(Administrador_Key)
  })

  // supervisor → activity keys
  const supActMap = new Map<number, number[]>()
  superActRub.forEach(({ Supervisor_Key, Actividad_Rub_Key }) => {
    if (!supActMap.has(Supervisor_Key)) supActMap.set(Supervisor_Key, [])
    supActMap.get(Supervisor_Key)!.push(Actividad_Rub_Key)
  })

  // sessions indexed by ID_Usuario
  const sessionsByUser = new Map<number, RpFactSession[]>()
  sessions.forEach((s) => {
    if (!sessionsByUser.has(s.ID_Usuario)) sessionsByUser.set(s.ID_Usuario, [])
    sessionsByUser.get(s.ID_Usuario)!.push(s)
  })

  return supervisores.map((sup) => {
    const userKeys = supUserMap.get(sup.Supervisor_Key) ?? new Set<number>()
    const supervised: RpFactSession[] = []
    userKeys.forEach((uk) => {
      // Usuario_Key === ID_Usuario per API schema
      const userSessions = sessionsByUser.get(uk) ?? []
      supervised.push(...userSessions)
    })
    const branchSet = new Set(supervised.map((s) => s.Administrador_Nombre))

    return {
      supervisorKey: sup.Supervisor_Key,
      name:  sup['Supervisor Nombre'],
      email: sup['Supervisor Email'],
      userCount:    userKeys.size,
      adminCount:   (supAdminMap.get(sup.Supervisor_Key) ?? new Set()).size,
      sessionCount: supervised.length,
      avgScore: supervised.length
        ? Math.round(avg(supervised.map((s) => parseScore(s.Puntos_Totales))))
        : 0,
      avgRobin: supervised.length
        ? Math.round(avg(supervised.map((s) => parsePct(s.Porcentaje_Robin))))
        : 0,
      activeBranches: branchSet.size,
      activityKeys: supActMap.get(sup.Supervisor_Key) ?? [],
    }
  }).sort((a, b) => b.sessionCount - a.sessionCount)
}

// ─────────────────────────────────────────────
// Criteria fulfillment per activity
// ─────────────────────────────────────────────

export interface CriterionStat {
  index: number
  label: string
  pctMet: number
  count: number   // sessions where this criterion was applicable
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

  // Find activity definition (prefer exact match; fall back to first)
  const actDef = activityName
    ? actividades.find((a) => a.Actividad_Rub_Nombre === activityName)
    : actividades[0]

  if (!actDef) return []

  return Array.from({ length: actDef.Numero_MC }, (_, i) => {
    const key      = `MC_${i + 1}_Hecho` as keyof RpFactSession
    const labelKey = `MC_${i + 1}` as keyof RpActividadRub
    const label    = actDef[labelKey] as string | undefined
    if (!label || label === 'No aplica') return null

    // Only count sessions where this criterion was actually assessed
    const applicable = filtered.filter((s) => {
      const v = s[key]
      return v !== 'No aplica' && v !== null && v !== undefined
    })
    if (!applicable.length) return null

    const met = applicable.filter((s) => isMCDone(s[key] as MCValue)).length

    return {
      index: i + 1,
      label,
      pctMet: pct(met, applicable.length),
      count: applicable.length,
    }
  }).filter((x): x is CriterionStat => x !== null)
}

// ─────────────────────────────────────────────
// Score distribution
// ─────────────────────────────────────────────

export interface RpScoreBucket {
  label: string
  count: number
  min: number
  max: number
}

export function computeRpScoreDistribution(sessions: RpFactSession[]): RpScoreBucket[] {
  const buckets: RpScoreBucket[] = [
    { label: '0–20',   min: 0,  max: 20,  count: 0 },
    { label: '21–40',  min: 21, max: 40,  count: 0 },
    { label: '41–60',  min: 41, max: 60,  count: 0 },
    { label: '61–80',  min: 61, max: 80,  count: 0 },
    { label: '81–100', min: 81, max: 100, count: 0 },
  ]
  sessions.forEach((s) => {
    const score = parseScore(s.Puntos_Totales)
    const b = buckets.find((bk) => score >= bk.min && score <= bk.max)
    if (b) b.count++
  })
  return buckets
}

// ─────────────────────────────────────────────
// Branch × Activity coverage (uses Admin_Act_Rub)
// ─────────────────────────────────────────────

export interface BranchActivityCoverage {
  branchKey: number
  branchName: string
  activityKeys: number[]
  sessionCount: number
  avgScore: number
}

export function computeBranchActivityCoverage(
  sessions: RpFactSession[],
  adminActRub: AdminActRub[],
  admins: import('../api/roleplayTypes').RpAdministrador[],
): BranchActivityCoverage[] {
  const adminMap = new Map<number, string>()
  admins.forEach((a) => adminMap.set(a.Administrador_Key, a.Administrador_Nombre))

  // Branch key → assigned activity keys
  const branchActKeys = new Map<number, number[]>()
  adminActRub.forEach(({ Administrador_Key, Actividad_Rub_Key }) => {
    if (!branchActKeys.has(Administrador_Key)) branchActKeys.set(Administrador_Key, [])
    branchActKeys.get(Administrador_Key)!.push(Actividad_Rub_Key)
  })

  // Branch name → sessions
  const sessionsByBranchName = new Map<string, RpFactSession[]>()
  sessions.forEach((s) => {
    if (!sessionsByBranchName.has(s.Administrador_Nombre)) sessionsByBranchName.set(s.Administrador_Nombre, [])
    sessionsByBranchName.get(s.Administrador_Nombre)!.push(s)
  })

  return Array.from(branchActKeys.entries()).map(([branchKey, actKeys]) => {
    const name = adminMap.get(branchKey) ?? `Branch ${branchKey}`
    const branchSessions = sessionsByBranchName.get(name) ?? []
    return {
      branchKey,
      branchName: name,
      activityKeys: [...new Set(actKeys)],
      sessionCount: branchSessions.length,
      avgScore: branchSessions.length
        ? Math.round(avg(branchSessions.map((s) => parseScore(s.Puntos_Totales))))
        : 0,
    }
  }).sort((a, b) => b.sessionCount - a.sessionCount)
}
