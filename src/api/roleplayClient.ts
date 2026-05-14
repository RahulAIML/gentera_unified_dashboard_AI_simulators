import type {
  DimSupervisoresResponse,
  DimAdministradoresResponse,
  DimUsuariosResponse,
  DimActividadesRubResponse,
  SuperUserResponse,
  SuperAdminResponse,
  SuperActRubResponse,
  FactRolPlayRubResponse,
  RpSupervisor,
  RpAdministrador,
  RpUsuario,
  RpActividadRub,
  SuperUser,
  SuperAdmin,
  SuperActRub,
  RpFactSession,
} from './roleplayTypes'

// Proxied via vite.config.ts: /rplay → https://rolplay.net
const BASE = '/rplay/gentera/pbi-dashboard-data'

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.json() as Promise<T>
}

export async function fetchRpSupervisores(): Promise<RpSupervisor[]> {
  const r = await fetchJSON<DimSupervisoresResponse>(`${BASE}/Dim_Supervisores.php`)
  return r.Dim_Supervisores ?? []
}

export async function fetchRpAdministradores(): Promise<RpAdministrador[]> {
  const r = await fetchJSON<DimAdministradoresResponse>(`${BASE}/Dim_Administradores.php`)
  return r.Dim_Administradores ?? []
}

export async function fetchRpUsuarios(): Promise<RpUsuario[]> {
  const r = await fetchJSON<DimUsuariosResponse>(`${BASE}/Dim_Usuarios.php`)
  return r.Dim_Usuarios ?? []
}

export async function fetchRpActividadesRub(): Promise<RpActividadRub[]> {
  const r = await fetchJSON<DimActividadesRubResponse>(`${BASE}/Dim_Actividades_Rub.php`)
  return r.Dim_Actividades_Rub ?? []
}

export async function fetchSuperUser(): Promise<SuperUser[]> {
  const r = await fetchJSON<SuperUserResponse>(`${BASE}/Super_User.php`)
  return r.Super_User ?? []
}

export async function fetchSuperAdmin(): Promise<SuperAdmin[]> {
  const r = await fetchJSON<SuperAdminResponse>(`${BASE}/Super_Admin.php`)
  return r.Super_Admin ?? []
}

export async function fetchSuperActRub(): Promise<SuperActRub[]> {
  const r = await fetchJSON<SuperActRubResponse>(`${BASE}/Super_Act_Rub.php`)
  return r.Super_Act_Rub ?? []
}

export async function fetchFactRolPlayRub(): Promise<RpFactSession[]> {
  const raw = await fetchJSON<FactRolPlayRubResponse>(`${BASE}/Fact_RolPlay_Rub.php`)
  if (Array.isArray(raw)) return raw
  if ('data' in raw && Array.isArray(raw.data)) return raw.data
  return []
}
