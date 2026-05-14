import type {
  RpSupervisor,
  RpAdministrador,
  RpUsuario,
  RpActividadRub,
  SuperUser,
  SuperAdmin,
  SuperActRub,
  SuperLinea,
  AdminActRub,
  UserActRub,
  RpFactSession,
} from './roleplayTypes'

// Proxied via vite.config.ts: /rplay → https://rolplay.net
const BASE = '/rplay/gentera/pbi-dashboard-data'

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.json() as Promise<T>
}

// Generic helper: all endpoints return { <WrapperKey>: T[] }
async function fetchWrapped<T>(endpoint: string, key: string): Promise<T[]> {
  const raw = await fetchJSON<Record<string, T[]>>(`${BASE}/${endpoint}`)
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw[key])) return raw[key]
  // Fallback: look for any array value
  const firstArr = Object.values(raw).find(Array.isArray)
  return (firstArr as T[] | undefined) ?? []
}

export async function fetchRpSupervisores(): Promise<RpSupervisor[]> {
  return fetchWrapped<RpSupervisor>('Dim_Supervisores.php', 'Dim_Supervisores')
}

export async function fetchRpAdministradores(): Promise<RpAdministrador[]> {
  return fetchWrapped<RpAdministrador>('Dim_Administradores.php', 'Dim_Administradores')
}

export async function fetchRpUsuarios(): Promise<RpUsuario[]> {
  return fetchWrapped<RpUsuario>('Dim_Usuarios.php', 'Dim_Usuarios')
}

export async function fetchRpActividadesRub(): Promise<RpActividadRub[]> {
  return fetchWrapped<RpActividadRub>('Dim_Actividades_Rub.php', 'Dim_Actividades_Rub')
}

export async function fetchSuperUser(): Promise<SuperUser[]> {
  return fetchWrapped<SuperUser>('Super_User.php', 'Super_User')
}

export async function fetchSuperAdmin(): Promise<SuperAdmin[]> {
  return fetchWrapped<SuperAdmin>('Super_Admin.php', 'Super_Admin')
}

export async function fetchSuperActRub(): Promise<SuperActRub[]> {
  return fetchWrapped<SuperActRub>('Super_Act_Rub.php', 'Super_Act_Rub')
}

export async function fetchSuperLinea(): Promise<SuperLinea[]> {
  return fetchWrapped<SuperLinea>('Super_Linea.php', 'Super_Linea')
}

export async function fetchAdminActRub(): Promise<AdminActRub[]> {
  return fetchWrapped<AdminActRub>('Admin_Act_Rub.php', 'Admin_Act_Rub')
}

export async function fetchUserActRub(): Promise<UserActRub[]> {
  return fetchWrapped<UserActRub>('User_Act_Rub.php', 'User_Act_Rub')
}

export async function fetchFactRolPlayRub(): Promise<RpFactSession[]> {
  // API returns { Fact_RolPlay_Rub: [...] } — NOT a bare array
  return fetchWrapped<RpFactSession>('Fact_RolPlay_Rub.php', 'Fact_RolPlay_Rub')
}
