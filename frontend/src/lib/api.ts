/**
 * Capa de acceso a la API de Vigía (backend Django DRF).
 *
 * Contrato: las LLAVES van en inglés; los VALORES de cara al usuario (textos del
 * checklist, resumen/estado ENFEN, fenómeno dominante) vienen en español desde el
 * backend. `level` e `intensity` son códigos — el front los rotula (ver mapas abajo).
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'

// ── Tipos del contrato ──────────────────────────────────────────────────────

export type RiskLevel = 'no_record' | 'low' | 'medium' | 'high'
export type Intensity = 'peak' | 'high' | 'medium' | 'low'

/** Fila de `GET /api/districts` (alimenta el dropdown / índice). */
export interface DistrictSummary {
  ubigeo_code: string
  name: string
  department: string
  count: number
  level: RiskLevel
  years: number[]
}

/** Punto de la línea de tiempo del distrito (un "dot" por año). */
export interface MemoryByYear {
  year: number
  intensity: Intensity
}

/** Memoria derivada en el backend desde las emergencias del distrito. */
export interface Memory {
  streak_years: number
  peak_year: number | null
  dominant_phenomenon: string | null
  by_year: MemoryByYear[]
}

/** Ítem del checklist curado de INDECI (texto en español). */
export interface ChecklistItem {
  emoji: string
  title: string
  detail: string
}

/** `GET /api/districts/<ubigeo>` — detalle para el panel "tu distrito". */
export interface DistrictDetail {
  ubigeo_code: string
  name: string
  department: string
  count: number
  level: RiskLevel
  memory: Memory
  checklist: ChecklistItem[]
}

/** `GET /api/enfen` — estado de alerta + resumen (regional). */
export interface EnfenStatus {
  state: string // en español: "Alerta de El Niño Costero", etc.
  summary: string
  bulletin_number: string
  date: string // ISO YYYY-MM-DD
  source_url: string
}

/** `GET /api/checklists` — checklist curado por nivel (texto en español). */
export interface ChecklistsResponse {
  source: string
  source_url: string
  disclaimer: string
  levels: Record<RiskLevel, ChecklistItem[]>
}

/** Propiedades de cada feature de `GET /api/districts/geojson`. */
export interface DistrictFeatureProps {
  ubigeo_code: string
  name: string
  department: string
  count: number
  level: RiskLevel
}

export interface DistrictFeature {
  type: 'Feature'
  geometry: unknown // GeoJSON Geometry — lo consume Leaflet directamente
  properties: DistrictFeatureProps
}

export interface DistrictFeatureCollection {
  type: 'FeatureCollection'
  features: DistrictFeature[]
}

// ── Helpers de presentación (level/intensity → etiqueta/color) ───────────────

/** Etiquetas en español para el código de nivel (el contrato usa códigos). */
export const LEVEL_LABELS: Record<RiskLevel, string> = {
  no_record: 'Sin registro',
  low: 'Bajo',
  medium: 'Medio',
  high: 'Alto',
}

/** Colores del choropleth por nivel. `no_record` = gris explícito (nunca verde). */
export const LEVEL_COLORS: Record<RiskLevel, string> = {
  no_record: '#9aa7b2',
  low: '#f0b88a',
  medium: '#f0a93b',
  high: '#d9482b',
}

// ── Fetchers ─────────────────────────────────────────────────────────────────

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`GET ${path} failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

/** Lista de distritos de costa norte (resumen). */
export function fetchDistricts(): Promise<DistrictSummary[]> {
  return apiGet<DistrictSummary[]>('/api/districts')
}

/** FeatureCollection con la geometría para el choropleth (Leaflet). */
export function fetchDistrictsGeojson(): Promise<DistrictFeatureCollection> {
  return apiGet<DistrictFeatureCollection>('/api/districts/geojson')
}

/** Checklist curado de INDECI agrupado por nivel. */
export function fetchChecklists(): Promise<ChecklistsResponse> {
  return apiGet<ChecklistsResponse>('/api/checklists')
}

/** Detalle de un distrito (memoria + checklist). */
export function fetchDistrict(ubigeoCode: string): Promise<DistrictDetail> {
  return apiGet<DistrictDetail>(`/api/districts/${ubigeoCode}`)
}

/**
 * Estado ENFEN vigente. Devuelve `null` si aún no hay comunicado cargado
 * (404), para que la UI pueda ocultar la banda en vez de romperse.
 */
export async function fetchEnfen(): Promise<EnfenStatus | null> {
  const response = await fetch(`${API_BASE_URL}/api/enfen`)
  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    throw new Error(`GET /api/enfen failed: ${response.status}`)
  }
  return response.json() as Promise<EnfenStatus>
}
