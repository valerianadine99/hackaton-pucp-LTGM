// Tipos y helpers del dominio Vigía (mock de primera iteración sobre data real precocida).

export type Nivel = 'alto' | 'medio' | 'bajo' | 'sin_registro'

export interface District {
  ubigeo: string
  nombre: string
  departamento: string
  conteo: number
  nivel: Exclude<Nivel, 'sin_registro'>
  anios: number[]
}

export interface Checklists {
  fuente: string
  fuente_url: string
  disclaimer: string
  niveles: Record<string, string[]>
}

// Escala de "memoria" del Niño: a más golpes, más intenso. Nunca verde (decisión #10).
// Gris explícito para distritos sin registro ("no significa sin riesgo").
export const LEVEL_COLOR: Record<Nivel, string> = {
  alto: '#b91c1c', // red-700
  medio: '#f97316', // orange-500
  bajo: '#fcd34d', // amber-300
  sin_registro: '#cbd5e1', // slate-300
}

export const LEVEL_LABEL: Record<Nivel, string> = {
  alto: 'Riesgo histórico alto',
  medio: 'Riesgo histórico medio',
  bajo: 'Riesgo histórico bajo',
  sin_registro: 'Sin emergencias registradas',
}

// Resumen ENFEN — PLACEHOLDER para el mock. En producción lo genera el ETL con una
// llamada real a Claude sobre el comunicado, cacheada en la BD.
export const ENFEN_SUMMARY = {
  estado: 'Alerta de El Niño Costero',
  resumen:
    'El ENFEN mantiene la Alerta de El Niño Costero. El evento, iniciado en marzo de 2026, ' +
    'podría alcanzar magnitud fuerte hacia el verano de 2027, con lluvias por encima de lo ' +
    'normal en la costa norte. Conviene prepararse desde ya.',
  fecha: 'Comunicado N° 11-2026',
  fuente_url: 'https://enfen.imarpe.gob.pe/comunicados/',
}
