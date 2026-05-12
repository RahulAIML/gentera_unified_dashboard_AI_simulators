import type {
  ActivitiesResponse,
  AdminsResponse,
  MembersResponse,
  Simulation,
  SimulationsResponse,
} from './types'

const BASE = '/gentera/api'
const IDS = 'id=82&id=102&id=121&id=122&id=123&id=124&id=125&id=126&id=127'

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.json() as Promise<T>
}

export async function fetchActivities(): Promise<ActivitiesResponse> {
  return fetchJSON<ActivitiesResponse>(`${BASE}/dim_actividades?${IDS}`)
}

export async function fetchSimulations(): Promise<Simulation[]> {
  const raw = await fetchJSON<SimulationsResponse>(`${BASE}/rol_play_sim_extractor?${IDS}`)
  if (Array.isArray(raw)) return raw
  if ('data' in raw && Array.isArray(raw.data)) return raw.data
  return []
}

export async function fetchMembers(): Promise<MembersResponse> {
  return fetchJSON<MembersResponse>(`${BASE}/data/rolplay_gentera_robin/members`)
}

export async function fetchAdmins(): Promise<AdminsResponse> {
  return fetchJSON<AdminsResponse>(`${BASE}/data/rolplay_gentera_robin/administrators`)
}
