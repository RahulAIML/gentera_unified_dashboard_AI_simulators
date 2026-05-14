import { useQuery } from '@tanstack/react-query'
import {
  fetchRpSupervisores,
  fetchRpAdministradores,
  fetchRpUsuarios,
  fetchRpActividadesRub,
  fetchSuperUser,
  fetchSuperAdmin,
  fetchSuperActRub,
  fetchSuperLinea,
  fetchAdminActRub,
  fetchUserActRub,
  fetchFactRolPlayRub,
} from './roleplayClient'

const STALE = 1000 * 60 * 5 // 5 minutes

export function useRpSupervisores() {
  return useQuery({ queryKey: ['rp_supervisores'], queryFn: fetchRpSupervisores, staleTime: STALE })
}

export function useRpAdministradores() {
  return useQuery({ queryKey: ['rp_admins'], queryFn: fetchRpAdministradores, staleTime: STALE })
}

export function useRpUsuarios() {
  return useQuery({ queryKey: ['rp_usuarios'], queryFn: fetchRpUsuarios, staleTime: STALE })
}

export function useRpActividadesRub() {
  return useQuery({ queryKey: ['rp_actividades'], queryFn: fetchRpActividadesRub, staleTime: STALE })
}

export function useSuperUser() {
  return useQuery({ queryKey: ['rp_super_user'], queryFn: fetchSuperUser, staleTime: STALE })
}

export function useSuperAdmin() {
  return useQuery({ queryKey: ['rp_super_admin'], queryFn: fetchSuperAdmin, staleTime: STALE })
}

export function useSuperActRub() {
  return useQuery({ queryKey: ['rp_super_act_rub'], queryFn: fetchSuperActRub, staleTime: STALE })
}

export function useSuperLinea() {
  return useQuery({ queryKey: ['rp_super_linea'], queryFn: fetchSuperLinea, staleTime: STALE })
}

export function useAdminActRub() {
  return useQuery({ queryKey: ['rp_admin_act_rub'], queryFn: fetchAdminActRub, staleTime: STALE })
}

export function useUserActRub() {
  return useQuery({ queryKey: ['rp_user_act_rub'], queryFn: fetchUserActRub, staleTime: STALE })
}

export function useFactRolPlayRub() {
  return useQuery({ queryKey: ['rp_fact'], queryFn: fetchFactRolPlayRub, staleTime: STALE })
}

export function useRoleplayData() {
  const supervisores  = useRpSupervisores()
  const admins        = useRpAdministradores()
  const usuarios      = useRpUsuarios()
  const actividades   = useRpActividadesRub()
  const superUser     = useSuperUser()
  const superAdmin    = useSuperAdmin()
  const superActRub   = useSuperActRub()
  const superLinea    = useSuperLinea()
  const adminActRub   = useAdminActRub()
  const userActRub    = useUserActRub()
  const fact          = useFactRolPlayRub()

  const isLoading =
    supervisores.isLoading || admins.isLoading || usuarios.isLoading ||
    actividades.isLoading  || superUser.isLoading || superAdmin.isLoading ||
    superActRub.isLoading  || adminActRub.isLoading || userActRub.isLoading ||
    fact.isLoading

  const isError =
    supervisores.isError || admins.isError || usuarios.isError ||
    actividades.isError  || superUser.isError || superAdmin.isError ||
    fact.isError

  return {
    supervisores:  supervisores.data  ?? [],
    admins:        admins.data        ?? [],
    usuarios:      usuarios.data      ?? [],
    actividades:   actividades.data   ?? [],
    superUser:     superUser.data     ?? [],
    superAdmin:    superAdmin.data    ?? [],
    superActRub:   superActRub.data   ?? [],
    superLinea:    superLinea.data    ?? [],
    adminActRub:   adminActRub.data   ?? [],
    userActRub:    userActRub.data    ?? [],
    sessions:      fact.data          ?? [],
    isLoading,
    isError,
    refetch: () => {
      supervisores.refetch(); admins.refetch(); usuarios.refetch()
      actividades.refetch();  superUser.refetch(); superAdmin.refetch()
      superActRub.refetch();  superLinea.refetch(); adminActRub.refetch()
      userActRub.refetch();   fact.refetch()
    },
  }
}
