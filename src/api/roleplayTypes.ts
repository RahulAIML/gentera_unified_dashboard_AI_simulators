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
  Actividad_Rub_Key: string   // NOTE: string in this table; integer in bridges
  Actividad_Rub_Nombre: string
  Puntos_Maximos_Facial: number
  Puntos_Maximos_Voz: number
  Puntos_Maximos_Palabras_por_Minuto: number
  Puntos_Maximos_Robin: number
  Numero_MC: number
  Puntos_por_MC: number
  MC_1: string;  MC_2: string;  MC_3: string;  MC_4: string;  MC_5: string
  MC_6: string;  MC_7: string;  MC_8: string;  MC_9: string;  MC_10: string
  MC_11: string; MC_12: string; MC_13: string; MC_14: string; MC_15: string
  MC_16: string; MC_17: string; MC_18: string; MC_19: string; MC_20: string
}

// ─────────────────────────────────────────────
// BRIDGE / JUNCTION TYPES
// ─────────────────────────────────────────────

export interface SuperUser    { Supervisor_Key: number; Usuario_Key: number }
export interface SuperAdmin   { Supervisor_Key: number; Administrador_Key: number }
export interface SuperLinea   { Supervisor_Key: number; Linea_Key: string | number }
export interface SuperActRub  { Supervisor_Key: number; Actividad_Rub_Key: number }

export interface AdminLinea   { Administrador_Key: number; Linea_Key: number }
export interface AdminActRub  {
  Administrador_Key: number
  Actividad_Rub_Key: number
  Actvidad_Rub_Src: string  // NOTE: intentional typo in API
}

export interface UserActRub {
  Usuario_Key: number
  Actividad_Rub_Key: number
  ActividadEstado: number   // 1 = assigned/active
}

export interface LineaActRub  { Linea_Key: number; Actividad_Rub_Key: number }

// ─────────────────────────────────────────────
// FACT TABLE — FACT_ROLPLAY_RUB
// • All score fields are strings in the API — parseFloat() before use
// • Num_MCs_Hechos is a string ("0", "3" …) — NOT a number
// • MC_*_Hecho values: 1 | 0 | null | "No aplica" (unscored criterion)
// • Date format: DD/MM/YYYY HH:MM:SS (NOT ISO)
// ─────────────────────────────────────────────

export type MCValue = 1 | 0 | null | string   // "No aplica" = not applicable

export interface RpFactSession {
  ID_Ejercicio_Rub: number
  ID_Usuario: number
  Actividad_Rub_Nombre: string        // denormalized
  Administrador_Nombre: string        // denormalized branch name
  Usuario_Nombre: string              // denormalized
  Fecha_y_Hora: string                // DD/MM/YYYY HH:MM:SS
  Fecha: string                       // DD/MM/YYYY
  Hora: string                        // HH:MM:SS
  Grabaciones: number
  Grabaciones_Calificadas: number
  Grabaciones_Totales: number
  Duracion_del_Video: string          // float string (seconds)
  Puntos_Robin: string
  Porcentaje_Robin: string            // "87.5"
  Puntos_Palabras_por_Minuto: string
  Porcentaje_Palabras_por_Minuto: string
  Puntos_Facial: string
  Porcentaje_Facial: string
  Puntos_Voz: string
  Porcentaje_Voz: string
  Puntos_Totales: string              // sum of dimension points
  MC_1_Hecho:  MCValue; MC_2_Hecho:  MCValue; MC_3_Hecho:  MCValue
  MC_4_Hecho:  MCValue; MC_5_Hecho:  MCValue; MC_6_Hecho:  MCValue
  MC_7_Hecho:  MCValue; MC_8_Hecho:  MCValue; MC_9_Hecho:  MCValue
  MC_10_Hecho: MCValue; MC_11_Hecho: MCValue; MC_12_Hecho: MCValue
  MC_13_Hecho: MCValue; MC_14_Hecho: MCValue; MC_15_Hecho: MCValue
  MC_16_Hecho: MCValue; MC_17_Hecho: MCValue; MC_18_Hecho: MCValue
  MC_19_Hecho: MCValue; MC_20_Hecho: MCValue
  Num_MCs_Hechos: string | number     // API sends string "0", "3" etc.
  Enlace_con_Resultados: string
}
