/**
 * Adapter: API en vivo (inglés) → tipos del dominio Vigía (español) que consumen
 * los componentes existentes. Así la UI lee de la BD vía la API (Principio VIII),
 * sin tocar los componentes ni los archivos estáticos.
 */
import type { GeoJsonObject } from 'geojson'
import { fetchDistricts, fetchDistrictsGeojson, type RiskLevel } from './api'
import type { District, Nivel } from './vigia'

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
