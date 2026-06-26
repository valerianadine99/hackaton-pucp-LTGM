'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import type { GeoJsonObject } from 'geojson'
import { LEVEL_COLOR, type District } from '@/lib/vigia'

interface Props {
  districts: Record<string, District>
  selected: string | null
  onSelect: (ubigeo: string, nombre: string) => void
}

// Choropleth de memoria histórica (SINPAD) sobre los polígonos distritales de costa norte.
// Sin capa de tiles: "nada en vivo" — los polígonos hablan por sí solos sobre fondo neutro.
export default function MapView({ districts, selected, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const layersRef = useRef<Record<string, any>>({})
  const selectedRef = useRef<string | null>(selected)
  const resizeCleanupRef = useRef<(() => void) | null>(null)

  function styleFor(ubigeo: string, isSelected: boolean) {
    const d = districts[ubigeo]
    const color = d ? LEVEL_COLOR[d.nivel] : LEVEL_COLOR.sin_registro
    return {
      fillColor: color,
      fillOpacity: isSelected ? 0.95 : 0.88,
      color: isSelected ? '#07302E' : '#F6F5F1',
      weight: isSelected ? 3 : 0.8,
    }
  }

  useEffect(() => {
    let cancelled = false
    if (!containerRef.current || mapRef.current) return

    ;(async () => {
      const L = (await import('leaflet')).default
      const geo: GeoJsonObject = await fetch('/data/northcoast.geojson').then((r) => r.json())
      if (cancelled || !containerRef.current) return

      const map = L.map(containerRef.current, { attributionControl: false, zoomControl: true })
      mapRef.current = map

      const layer = L.geoJSON(geo, {
        style: (f: any) => styleFor(f.properties.ubigeo, false),
        onEachFeature: (f: any, lyr: any) => {
          const ubigeo: string = f.properties.ubigeo
          const d = districts[ubigeo]
          layersRef.current[ubigeo] = lyr
          const conteo = d ? `${d.conteo} emergencia(s)` : 'sin registro'
          lyr.bindTooltip(`${f.properties.nombre} — ${conteo}`, { sticky: true })
          lyr.on('click', () => onSelect(ubigeo, f.properties.nombre))
          lyr.on('mouseover', () => lyr.setStyle({ weight: 2.5 }))
          lyr.on('mouseout', () => {
            if (selectedRef.current !== ubigeo) lyr.setStyle({ weight: 1 })
          })
        },
      }).addTo(map)

      map.fitBounds(layer.getBounds(), { padding: [12, 12] })
      // Reajustar al cambiar tamaño (rotación / breakpoint móvil↔desktop).
      const onResize = () => {
        map.invalidateSize()
        map.fitBounds(layer.getBounds(), { padding: [12, 12] })
      }
      window.addEventListener('resize', onResize)
      resizeCleanupRef.current = () => window.removeEventListener('resize', onResize)
    })()

    return () => {
      cancelled = true
      resizeCleanupRef.current?.()
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        layersRef.current = {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districts])

  // Resaltar el distrito seleccionado.
  useEffect(() => {
    selectedRef.current = selected
    Object.entries(layersRef.current).forEach(([ubigeo, lyr]) => {
      lyr.setStyle(styleFor(ubigeo, ubigeo === selected))
      if (ubigeo === selected) lyr.bringToFront()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  return <div ref={containerRef} className="h-full w-full bg-[#ECEAE3]" />
}
