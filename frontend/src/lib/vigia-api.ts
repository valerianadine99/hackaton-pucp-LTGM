/**
 * Adapter: API en vivo (inglés) → tipos del dominio Vigía (español) que consumen
 * los componentes existentes. Así la UI lee de la BD vía la API (Principio VIII),
 * sin tocar los componentes ni los archivos estáticos.
 */
import type { GeoJsonObject } from 'geojson'
import {
  fetchChecklists,
  fetchDistricts,
  fetchDistrictsGeojson,
  fetchEnfen,
  type RiskLevel,
} from './api'
import type { Checklists, ChecklistItem, District, EnfenSummary, Nivel } from './vigia'

const LEVEL_ES: Record<RiskLevel, Nivel> = {
  high: 'alto',
  medium: 'medio',
  low: 'bajo',
  no_record: 'sin_registro',
}

/** Distritos con registro (alto/medio/bajo) indexados por ubigeo, desde `/api/districts`. */
export async function loadDistricts(): Promise<Record<string, District>> {
  const rows = await fetchDistricts()
  const out: Record<string, District> = {}
  for (const r of rows) {
    if (r.level === 'no_record') continue // los grises viven solo en el GeoJSON
    out[r.ubigeo_code] = {
      ubigeo: r.ubigeo_code,
      nombre: r.name,
      departamento: r.department,
      conteo: r.count,
      nivel: LEVEL_ES[r.level] as District['nivel'],
      anios: r.years,
    }
  }
  return out
}

/** FeatureCollection con props en español (ubigeo/nombre), desde `/api/districts/geojson`. */
export async function loadGeojson(): Promise<GeoJsonObject> {
  const fc = await fetchDistrictsGeojson()
  return {
    type: 'FeatureCollection',
    features: fc.features.map((f) => ({
      type: 'Feature',
      geometry: f.geometry,
      properties: {
        ubigeo: f.properties.ubigeo_code,
        nombre: f.properties.name,
        departamento: f.properties.department,
        conteo: f.properties.count,
        nivel: LEVEL_ES[f.properties.level],
      },
    })),
  } as unknown as GeoJsonObject
}

/** Checklist curado por nivel, desde `/api/checklists`. */
export async function loadChecklists(): Promise<Checklists> {
  const c = await fetchChecklists()
  const niveles: Record<string, ChecklistItem[]> = {}
  for (const [level, items] of Object.entries(c.levels)) {
    niveles[LEVEL_ES[level as RiskLevel]] = items.map((it) => ({
      emoji: it.emoji,
      titulo: it.title,
      detalle: it.detail,
    }))
  }
  return { fuente: c.source, fuente_url: c.source_url, disclaimer: c.disclaimer, niveles }
}

/**
 * Estado ENFEN desde `/api/enfen`. `resumen` puede venir vacío si aún no se generó
 * con la API key de Claude — el panel lo maneja con honestidad (no inventa texto).
 */
export async function loadEnfen(): Promise<EnfenSummary | null> {
  const e = await fetchEnfen()
  if (!e) return null
  return {
    estado: e.state,
    resumen: e.summary,
    fecha: e.bulletin_number ? `Comunicado ${e.bulletin_number} · ${e.date}` : e.date,
    fuente_url: e.source_url,
  }
}
