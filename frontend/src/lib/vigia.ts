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

export interface ChecklistItem {
  emoji: string
  titulo: string
  detalle: string
}

export interface Checklists {
  fuente: string
  fuente_url: string
  disclaimer: string
  niveles: Record<string, ChecklistItem[]>
}

// Escala de "memoria" del Niño: a más golpes, más intenso. Nunca verde (decisión #10).
// Gris explícito para distritos sin registro ("no significa sin riesgo").
export const LEVEL_COLOR: Record<Nivel, string> = {
  alto: '#d23b3b', // rojo — la memoria más golpeada
  medio: '#e07c2a', // naranja
  bajo: '#e3b23c', // dorado
  sin_registro: '#9aa3ab', // gris honesto, nunca verde
}

export const LEVEL_LABEL: Record<Nivel, string> = {
  alto: 'Riesgo histórico alto',
  medio: 'Riesgo histórico medio',
  bajo: 'Riesgo histórico bajo',
  sin_registro: 'Sin emergencias registradas',
}

export interface EnfenSummary {
  estado: string
  resumen: string
  fecha: string
  fuente_url: string
  nota?: string
}

// Fallback si no carga /data/enfen.json. Texto basado en el comunicado oficial N° 11-2026.
// En producción el resumen lo genera el ETL con una llamada real a Claude, cacheada en la BD.
export const ENFEN_SUMMARY: EnfenSummary = {
  estado: 'Alerta de El Niño Costero',
  resumen:
    'El ENFEN mantiene la Alerta de El Niño Costero. El evento, iniciado en marzo de 2026, ' +
    'se prolongaría hasta el verano de 2027, con mayor probabilidad de magnitud fuerte entre ' +
    'junio y septiembre. De cara a la próxima temporada de lluvias conviene prepararse desde ya.',
  fecha: 'Comunicado Oficial ENFEN N° 11-2026 · 15 de junio de 2026',
  fuente_url: 'https://enfen.imarpe.gob.pe/comunicados/',
  nota: 'Resumen de muestra basado en el texto oficial; en producción lo genera la IA (Claude).',
}
