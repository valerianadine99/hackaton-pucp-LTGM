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
