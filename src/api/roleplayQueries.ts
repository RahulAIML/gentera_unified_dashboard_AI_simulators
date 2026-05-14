import { useQuery } from '@tanstack/react-query'
import {
  fetchRpSupervisores,
  fetchRpAdministradores,
  fetchRpUsuarios,
  fetchRpActividadesRub,
  fetchSuperUser,
  fetchSuperAdmin,
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

export function useFactRolPlayRub() {
  return useQuery({ queryKey: ['rp_fact'], queryFn: fetchFactRolPlayRub, staleTime: STALE })
}

export function useRoleplayData() {
  const supervisores = useRpSupervisores()
  const admins = useRpAdministradores()
  const usuarios = useRpUsuarios()
  const actividades = useRpActividadesRub()
  const superUser = useSuperUser()
  const superAdmin = useSuperAdmin()
  const fact = useFactRolPlayRub()

  return {
    supervisores: supervisores.data ?? [],
    admins: admins.data ?? [],
    usuarios: usuarios.data ?? [],
    actividades: actividades.data ?? [],
    superUser: superUser.data ?? [],
    superAdmin: superAdmin.data ?? [],
    sessions: fact.data ?? [],
    isLoading:
      supervisores.isLoading ||
      admins.isLoading ||
      usuarios.isLoading ||
      actividades.isLoading ||
      superUser.isLoading ||
      superAdmin.isLoading ||
      fact.isLoading,
    isError:
      supervisores.isError ||
      admins.isError ||
      usuarios.isError ||
      actividades.isError ||
      superUser.isError ||
      superAdmin.isError ||
      fact.isError,
    refetch: () => {
      supervisores.refetch()
      admins.refetch()
      usuarios.refetch()
      actividades.refetch()
      superUser.refetch()
      superAdmin.refetch()
      fact.refetch()
    },
  }
}
