import type { Activity, Administrator, Member, Simulation } from '../api/types'
// re-export so pages can import directly
export type { Simulation }

export const PASS_THRESHOLD = 60

// ─────────────────────────────────────────────
// Test / demo user blocklist
// ─────────────────────────────────────────────
const TEST_USER_BLOCKLIST = new Set([
  'Tester Gentera Demo',
  'Tester Gentera Grupal',
  'Tester Gentera Completo',
  'Tester Gentera Individual',
  'Piloto 1', 'Piloto 2', 'Piloto 8',
  'Guadaupe Cuevas', 'Guadalupe Cuevas ',
  'Regina Guzmán', 'Andrea Fernanda',
  'Aurea Regina Guzmán Montero',
  'Andrea Campos', 'Regina',
  'Mario ', 'Gabriel Regalado', 'Gentera01',
])

/** Remove simulations belonging to known test/demo accounts */
export function filterTestUsers(sims: Simulation[]): Simulation[] {
  return sims.filter((s) => !TEST_USER_BLOCKLIST.has(s.Usuario_Nombre))
}

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

/** True only for numeric 0/1 interaction values — excludes "No aplica" and null */
function isApplicable(v: unknown): v is number {
  return typeof v === 'number'
}

const INTERACTION_KEYS = ['Puntos_1','Puntos_2','Puntos_3','Puntos_4','Puntos_5','Puntos_6'] as const

/** Count of applicable (numeric) interactions for one simulation */
function countApplicable(s: Simulation): number {
  return INTERACTION_KEYS.filter((k) => isApplicable(s[k])).length
}

/**
 * Correct avg score: total points earned / total applicable interactions.
 * e.g. 100 pts across 120 interactions = 83%.
 */
function avgScore(sims: Simulation[]): number {
  const totalPts  = sims.reduce((sum, s) => sum + s.Puntos_Totales, 0)
  const totalEvts = sims.reduce((sum, s) => sum + countApplicable(s), 0)
  return pct(totalPts, totalEvts)
}

// ─────────────────────────────────────────────
// Core KPIs
// ─────────────────────────────────────────────
export interface DashboardKPIs {
  totalSimulations: number
  averageScore: number
  passRate: number
  activeAdvisors: number
  totalActivities: number
  totalMembers: number
  totalAdmins: number
  totalSupervisors: number
  bestScore: number
  worstScore: number
  passCount: number
  failCount: number
}

export function computeKPIs(
  sims: Simulation[],
  activities: Activity[],
  members: Member[],
  admins: Administrator[],
): DashboardKPIs {
  const passCount = sims.filter((s) => s.Diagnostico_Final === 'Si').length
  const advisors = new Set(sims.map((s) => s.Usuario_Nombre))
  const scores = sims.map((s) => s.Calificacion)

  return {
    totalSimulations: sims.length,
    averageScore: avgScore(sims),
    passRate: pct(passCount, sims.length),
    activeAdvisors: advisors.size,
    totalActivities: activities.length,
    totalMembers: members.length,
    totalAdmins: admins.filter((a) => a.rpa_profile_type === 'admin').length,
    totalSupervisors: admins.filter((a) => a.rpa_profile_type === 'supervisor').length,
    bestScore: scores.length ? Math.max(...scores) : 0,
    worstScore: scores.length ? Math.min(...scores) : 0,
    passCount,
    failCount: sims.length - passCount,
  }
}

// ─────────────────────────────────────────────
// Score Distribution
// ─────────────────────────────────────────────
export interface ScoreBucket {
  label: string
  count: number
  min: number
  max: number
}

export function computeScoreDistribution(sims: Simulation[]): ScoreBucket[] {
  const buckets: ScoreBucket[] = [
    { label: '0–20', min: 0, max: 20, count: 0 },
    { label: '21–40', min: 21, max: 40, count: 0 },
    { label: '41–60', min: 41, max: 60, count: 0 },
    { label: '61–80', min: 61, max: 80, count: 0 },
    { label: '81–100', min: 81, max: 100, count: 0 },
  ]
  sims.forEach((s) => {
    const b = buckets.find((bk) => s.Calificacion >= bk.min && s.Calificacion <= bk.max)
    if (b) b.count++
  })
  return buckets
}

// ─────────────────────────────────────────────
// Trend over time
// ─────────────────────────────────────────────
export interface TrendPoint {
  date: string
  avgScore: number
  count: number
  passRate: number
}

export function computeTrend(sims: Simulation[]): TrendPoint[] {
  const byDate: Record<string, Simulation[]> = {}
  sims.forEach((s) => {
    const date = s.Fecha_y_Hora.split('T')[0]
    if (!byDate[date]) byDate[date] = []
    byDate[date].push(s)
  })
  return Object.entries(byDate)
    .map(([date, group]) => ({
      date,
      avgScore: Math.round(avg(group.map((s) => s.Calificacion))),
      count: group.length,
      passRate: pct(
        group.filter((s) => s.Diagnostico_Final === 'Si').length,
        group.length,
      ),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// ─────────────────────────────────────────────
// Round-level averages (Puntos_1..6)
// ─────────────────────────────────────────────
export interface RoundStat {
  round: number
  label: string
  avg: number
  passRate: number
  count: number
}

export function computeRoundStats(sims: Simulation[]): RoundStat[] {
  return [1, 2, 3, 4, 5, 6].map((i) => {
    const key = `Puntos_${i}` as keyof Simulation
    const values = sims
      .map((s) => s[key])
      .filter(isApplicable)            // excludes "No aplica" and null
    return {
      round: i,
      label: `I${i}`,                  // I = Interaction
      avg: values.length ? Math.round(avg(values) * 100) / 100 : 0,
      passRate: values.length ? pct(values.filter((v) => v > 0).length, values.length) : 0,
      count: values.length,
    }
  }).filter((r) => r.count > 0)       // only include interactions that have real data
}

// ─────────────────────────────────────────────
// Activity statistics
// ─────────────────────────────────────────────
export interface ActivityStat {
  id: number
  name: string
  activityType: string
  count: number
  avgScore: number
  passRate: number
  passCount: number
  failCount: number
}

export function computeActivityStats(
  sims: Simulation[],
  activities: Activity[],
): ActivityStat[] {
  const actMap = new Map(activities.map((a) => [a.ID_Caso_de_Uso, a]))
  const byActivity: Record<number, Simulation[]> = {}
  sims.forEach((s) => {
    if (!byActivity[s.ID_Caso_de_Uso]) byActivity[s.ID_Caso_de_Uso] = []
    byActivity[s.ID_Caso_de_Uso].push(s)
  })
  return Object.entries(byActivity).map(([id, group]) => {
    const numId = Number(id)
    const act = actMap.get(numId)
    const passCount = group.filter((s) => s.Diagnostico_Final === 'Si').length
    return {
      id: numId,
      name: act?.Caso_de_Uso ?? `Activity ${id}`,
      activityType: act?.Actividad_Nombre ?? 'unknown',
      count: group.length,
      avgScore: avgScore(group),
      passRate: pct(passCount, group.length),
      passCount,
      failCount: group.length - passCount,
    }
  })
}

// ─────────────────────────────────────────────
// User (advisor) statistics — leaderboard
// ─────────────────────────────────────────────
export interface UserStat {
  name: string
  userId: string
  count: number
  avgScore: number
  passRate: number
  bestScore: number
  passCount: number
}

export function computeUserStats(sims: Simulation[]): UserStat[] {
  const byUser: Record<string, Simulation[]> = {}
  sims.forEach((s) => {
    const key = s.Usuario_Nombre || s.Usuario || 'Unknown'
    if (!byUser[key]) byUser[key] = []
    byUser[key].push(s)
  })
  return Object.entries(byUser)
    .map(([name, group]) => {
      const passCount = group.filter((s) => s.Diagnostico_Final === 'Si').length
      const scores = group.map((s) => s.Calificacion)
      return {
        name,
        userId: group[0].Usuario,
        count: group.length,
        avgScore: avgScore(group),
        passRate: pct(passCount, group.length),
        bestScore: Math.max(...scores),
        passCount,
      }
    })
    .sort((a, b) => b.avgScore - a.avgScore)
}

// ─────────────────────────────────────────────
// Organization hierarchy
// ─────────────────────────────────────────────
export interface OrgNode {
  id: number
  name: string
  email: string
  type: string
  parentId: number
  children: OrgNode[]
  memberCount: number
}

export function buildOrgTree(admins: Administrator[], members: Member[]): OrgNode[] {
  const adminMemberCount = new Map<number, number>()
  members.forEach((m) => {
    adminMemberCount.set(m.mb_admin, (adminMemberCount.get(m.mb_admin) ?? 0) + 1)
  })

  const nodes = new Map<number, OrgNode>(
    admins.map((a) => [
      a.rpa_id,
      {
        id: a.rpa_id,
        name: a.rpa_full_name,
        email: a.rpa_email,
        type: a.rpa_profile_type,
        parentId: a.rpa_parent,
        children: [],
        memberCount: adminMemberCount.get(a.rpa_id) ?? 0,
      },
    ]),
  )

  const roots: OrgNode[] = []
  nodes.forEach((node) => {
    const parent = nodes.get(node.parentId)
    if (parent && node.parentId !== 0) {
      parent.children.push(node)
    } else if (node.type === 'supervisor' || node.type === 'tenant') {
      roots.push(node)
    }
  })
  return roots
}

// ─────────────────────────────────────────────
// Coaching feedback analysis
// ─────────────────────────────────────────────
export interface FeedbackEntry {
  simId: number
  userName: string
  round: number
  question: string
  response: string
  feedback: string
  points: number
}

export function extractFeedback(sims: Simulation[]): FeedbackEntry[] {
  const entries: FeedbackEntry[] = []
  sims.forEach((s) => {
    for (let i = 1; i <= 6; i++) {
      const puntos = s[`Puntos_${i}` as keyof Simulation]
      if (!isApplicable(puntos)) continue   // skip "No aplica" and null
      const feedback = s[`Retroalimentacion_${i}` as keyof Simulation] as string | null
      if (!feedback) continue
      entries.push({
        simId: s.ID_Sim,
        userName: s.Usuario_Nombre,
        round: i,
        question: (s[`Pregunta_${i}` as keyof Simulation] as string | null) ?? '',
        response: (s[`Respuesta_${i}` as keyof Simulation] as string | null) ?? '',
        feedback,
        points: puntos,
      })
    }
  })
  return entries
}

// ─────────────────────────────────────────────
// AI Context String (for Gemini)
// ─────────────────────────────────────────────
export function buildAIContext(
  kpis: DashboardKPIs,
  sims: Simulation[],
  activities: Activity[],
  actStats: ActivityStat[],
  userStats: UserStat[],
  roundStats?: RoundStat[] | null,
  pagePath?: string,
): string {
  // Top and bottom performers
  const topPerformers  = userStats.slice(0, 10).map((u) =>
    `  ${u.name}: avg ${u.avgScore}%, pass ${u.passRate}%, ${u.count} sim(s)`,
  ).join('\n')

  const lowPerformers = userStats
    .filter((u) => u.avgScore < 60)
    .slice(0, 8)
    .map((u) => `  ${u.name}: avg ${u.avgScore}%, pass ${u.passRate}%`)
    .join('\n')

  // Activity breakdown with pass rates
  const actList = actStats
    .map((a) => `  ${a.name}: ${a.count} sims | avg ${a.avgScore}% | pass ${a.passRate}% (${a.passCount}✓ ${a.failCount}✗)`)
    .join('\n')

  // Round/interaction stats
  const roundList = (roundStats ?? [])
    .map((r) => `  Interaction ${r.round}: avg pts ${r.avg} | pass ${r.passRate}% | ${r.count} responses`)
    .join('\n')

  // Recent 10 simulations
  const recent = sims
    .slice(-10)
    .map((s) => {
      const actName = activities.find((a) => a.ID_Caso_de_Uso === s.ID_Caso_de_Uso)?.Caso_de_Uso ?? `Act ${s.ID_Caso_de_Uso}`
      return `  ${s.Usuario_Nombre} | ${actName} | ${s.Calificacion}% | ${s.Diagnostico_Final === 'Si' ? 'PASS' : 'FAIL'} | ${s.Fecha_y_Hora.slice(0, 10)}`
    })
    .join('\n')

  // Score distribution
  const scoreRanges = [
    { label: '80-100%', sims: sims.filter((s) => s.Calificacion >= 80) },
    { label: '60-79%',  sims: sims.filter((s) => s.Calificacion >= 60 && s.Calificacion < 80) },
    { label: '40-59%',  sims: sims.filter((s) => s.Calificacion >= 40 && s.Calificacion < 60) },
    { label: '0-39%',   sims: sims.filter((s) => s.Calificacion < 40) },
  ]
  const scoreDist = scoreRanges.map((r) => `  ${r.label}: ${r.sims.length} advisors`).join('\n')

  // Page-specific extra context
  let pageExtra = ''
  if (pagePath === '/coaching') {
    const needsHelp = userStats.filter((u) => u.avgScore < 60).slice(0, 5)
    pageExtra = '\nCOACHING FOCUS:\n' +
      (needsHelp.length
        ? `  Advisors needing support: ${needsHelp.map((u) => `${u.name} (${u.avgScore}%)`).join(', ')}`
        : '  All advisors above 60% threshold — maintain momentum.')
  }
  if (pagePath === '/leaderboard') {
    pageExtra = '\nLEADERBOARD SNAPSHOT (Top 5):\n' +
      userStats.slice(0, 5).map((u, i) =>
        `  #${i + 1} ${u.name}: ${u.avgScore}% avg, ${u.passRate}% pass rate`,
      ).join('\n')
  }
  if (pagePath === '/activities') {
    const weak = actStats.filter((a) => a.passRate < 60)
    pageExtra = '\nACTIVITY ALERTS:\n' +
      (weak.length
        ? `  Below 60% pass rate: ${weak.map((a) => `${a.name} (${a.passRate}%)`).join(', ')}`
        : '  All activities above 60% pass rate.')
  }

  return `
GENTERA CONVERSATIONAL INTELLIGENCE PLATFORM — LIVE DASHBOARD DATA
===================================================================
Platform: AI-powered B2B sales simulation & coaching for financial advisors
Industry: Microfinance / Financial Services (Compartamos Banco / Gentera Group)
Use case: Role-play simulations, conversational AI scoring, advisor performance tracking

OVERALL KPIs
------------
Total Simulations : ${kpis.totalSimulations}
Average Score     : ${kpis.averageScore}%
Pass Rate         : ${kpis.passRate}%  (${kpis.passCount} passed / ${kpis.failCount} failed)
Active Advisors   : ${kpis.activeAdvisors}
Best Score        : ${kpis.bestScore}%
Lowest Score      : ${kpis.worstScore}%
Total Members     : ${kpis.totalMembers}
Admins            : ${kpis.totalAdmins}
Supervisors       : ${kpis.totalSupervisors}

SCORE DISTRIBUTION
------------------
${scoreDist}

ACTIVITIES (${actStats.length} total)
-----------
${actList || '  No activity data available.'}

${roundList ? `INTERACTION / ROUND BREAKDOWN\n-----------------------------\n${roundList}` : ''}

TOP PERFORMERS (by avg score)
-----------------------------
${topPerformers || '  No performer data available.'}

${lowPerformers ? `ADVISORS BELOW 60% THRESHOLD\n----------------------------\n${lowPerformers}` : 'All advisors are above the 60% pass threshold.'}

RECENT SIMULATIONS (last 10)
----------------------------
${recent || '  No recent simulations.'}

AVAILABLE ACTIVITIES: ${activities.map((a) => a.Caso_de_Uso).join(' | ')}
${pageExtra}
  `.trim()
}
