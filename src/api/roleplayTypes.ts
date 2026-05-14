// ─────────────────────────────────────────────
// ROLEPLAY DIMENSION TYPES (rolplay.net)
// ─────────────────────────────────────────────

export interface RpSupervisor {
  ID_Supervisor: number
  Supervisor_Key: number
  'Supervisor Nombre': string
  'Supervisor Nombre Corto': string
  'Supervisor Email': string
  'Supervisor Foto': string
}

export interface RpAdministrador {
  ID_Administrador: number
  Administrador_Key: number
  Administrador_Nombre: string
  Administrador_Nombre_Corto: string
  Administrador_Email: string
  Administrador_Foto: string
}

export interface RpUsuario {
  ID_Usuario: number
  Usuario_Key: number
  Usuario_Nombre: string
  Usuario_Nombre_Corto: string
  Usuario_Email: string
  Usuario_Foto: string
  Administrador_Key: number
  Linea_Key: number
}

export interface RpLinea {
  Linea_Key: number
  Linea_Nombre?: string
}

export interface RpActividadRub {
  Actividad_Rub_Key: string // NOTE: string in this table, cast to number on use
  Actividad_Rub_Nombre: string
  Puntos_Maximos_Facial: number
  Puntos_Maximos_Voz: number
  Puntos_Maximos_Palabras_por_Minuto: number
  Puntos_Maximos_Robin: number
  Numero_MC: number
  Puntos_por_MC: number
  MC_1: string
  MC_2: string
  MC_3: string
  MC_4: string
  MC_5: string
  MC_6: string
  MC_7: string
  MC_8: string
  MC_9: string
  MC_10: string
  MC_11: string
  MC_12: string
  MC_13: string
  MC_14: string
  MC_15: string
  MC_16: string
  MC_17: string
  MC_18: string
  MC_19: string
  MC_20: string
}

// ─────────────────────────────────────────────
// BRIDGE / JUNCTION TYPES
// ─────────────────────────────────────────────

export interface SuperUser { Supervisor_Key: number; Usuario_Key: number }
export interface SuperAdmin { Supervisor_Key: number; Administrador_Key: number }
export interface SuperLinea { Supervisor_Key: number; Linea_Key: string | number }
export interface SuperActRub { Supervisor_Key: number; Actividad_Rub_Key: number }

export interface AdminLinea { Administrador_Key: number; Linea_Key: number }
export interface AdminActRub {
  Administrador_Key: number
  Actividad_Rub_Key: number
  Actvidad_Rub_Src: string // NOTE: intentional typo in API
}

export interface UserActRub {
  Usuario_Key: number
  Actividad_Rub_Key: number
  ActividadEstado: number
}

export interface LineaActRub { Linea_Key: number; Actividad_Rub_Key: number }

// ─────────────────────────────────────────────
// FACT TABLE — FACT_ROLPLAY_RUB
// All numeric score fields are strings in the API — parse before use
// Date format: DD/MM/YYYY HH:MM:SS (NOT ISO)
// ─────────────────────────────────────────────

export interface RpFactSession {
  ID_Ejercicio_Rub: number
  ID_Usuario: number
  Actividad_Rub_Nombre: string   // denormalized
  Administrador_Nombre: string   // denormalized
  Usuario_Nombre: string         // denormalized
  Fecha_y_Hora: string           // DD/MM/YYYY HH:MM:SS
  Fecha: string                  // DD/MM/YYYY
  Hora: string                   // HH:MM:SS
  Grabaciones: number
  Grabaciones_Calificadas: number
  Grabaciones_Totales: number
  Duracion_del_Video: string     // float as string (seconds)
  Puntos_Robin: string           // numeric string
  Porcentaje_Robin: string       // float string 0-100
  Puntos_Palabras_por_Minuto: string
  Porcentaje_Palabras_por_Minuto: string
  Puntos_Facial: string
  Porcentaje_Facial: string
  Puntos_Voz: string
  Porcentaje_Voz: string
  Puntos_Totales: string         // float string
  MC_1_Hecho: number | boolean | null
  MC_2_Hecho: number | boolean | null
  MC_3_Hecho: number | boolean | null
  MC_4_Hecho: number | boolean | null
  MC_5_Hecho: number | boolean | null
  MC_6_Hecho: number | boolean | null
  MC_7_Hecho: number | boolean | null
  MC_8_Hecho: number | boolean | null
  MC_9_Hecho: number | boolean | null
  MC_10_Hecho: number | boolean | null
  MC_11_Hecho: number | boolean | null
  MC_12_Hecho: number | boolean | null
  MC_13_Hecho: number | boolean | null
  MC_14_Hecho: number | boolean | null
  MC_15_Hecho: number | boolean | null
  MC_16_Hecho: number | boolean | null
  MC_17_Hecho: number | boolean | null
  MC_18_Hecho: number | boolean | null
  MC_19_Hecho: number | boolean | null
  MC_20_Hecho: number | boolean | null
  Num_MCs_Hechos: number
  Enlace_con_Resultados: string
}

// ─────────────────────────────────────────────
// API RESPONSE WRAPPERS
// ─────────────────────────────────────────────

export interface DimSupervisoresResponse { Dim_Supervisores: RpSupervisor[] }
export interface DimAdministradoresResponse { Dim_Administradores: RpAdministrador[] }
export interface DimUsuariosResponse { Dim_Usuarios: RpUsuario[] }
export interface DimLineaResponse { Dim_Linea: RpLinea[] }
export interface DimActividadesRubResponse { Dim_Actividades_Rub: RpActividadRub[] }

export interface SuperUserResponse { Super_User: SuperUser[] }
export interface SuperAdminResponse { Super_Admin: SuperAdmin[] }
export interface SuperLineaResponse { Super_Linea: SuperLinea[] }
export interface SuperActRubResponse { Super_Act_Rub: SuperActRub[] }
export interface AdminLineaResponse { Admin_Linea: AdminLinea[] }
export interface AdminActRubResponse { Admin_Act_Rub: AdminActRub[] }
export interface UserActRubResponse { User_Act_Rub: UserActRub[] }
export interface LineaActRubResponse { Linea_Act_Rub: LineaActRub[] }

export type FactRolPlayRubResponse = RpFactSession[] | { data: RpFactSession[] }
