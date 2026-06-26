'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Legend } from '@/components/Legend'
import { DistrictPanel } from '@/components/DistrictPanel'
import type { Checklists, District, EnfenSummary } from '@/lib/vigia'

// Leaflet toca window -> sin SSR.
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      Cargando mapa…
    </div>
  ),
})

export default function Home() {
  const [districts, setDistricts] = useState<Record<string, District>>({})
  const [checklists, setChecklists] = useState<Checklists | null>(null)
  const [enfen, setEnfen] = useState<EnfenSummary | null>(null)
  const [selected, setSelected] = useState<{ ubigeo: string; nombre: string } | null>(null)

  useEffect(() => {
    fetch('/data/districts.json')
      .then((r) => r.json())
      .then((rows: District[]) =>
        setDistricts(Object.fromEntries(rows.map((d) => [d.ubigeo, d])))
      )
    fetch('/data/checklists.json').then((r) => r.json()).then(setChecklists)
    fetch('/data/enfen.json').then((r) => r.json()).then(setEnfen)
  }, [])

  const options = useMemo(
    () => Object.values(districts).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [districts]
  )

  const selectedDistrict = selected ? districts[selected.ubigeo] ?? null : null

  return (
    <div className="flex min-h-[100dvh] flex-col md:h-[100dvh] md:overflow-hidden">
      {/* Header — mobile-first: apila en móvil, fila en sm+ */}
      <header className="sticky top-0 z-[1100] flex flex-col gap-2 border-b bg-background/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            Vigía <span className="font-normal text-muted-foreground">· costa norte</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Tu distrito, cuántas veces se inundó, y qué hacer hoy.
          </p>
        </div>
        {/* Dropdown de respaldo (decisión #8) — full-width en móvil */}
        <select
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm sm:h-9 sm:w-56"
          value={selected?.ubigeo ?? ''}
          onChange={(e) => {
            const d = districts[e.target.value]
            if (d) setSelected({ ubigeo: d.ubigeo, nombre: d.nombre })
          }}
        >
          <option value="" disabled>
            Busca tu distrito…
          </option>
          {options.map((d) => (
            <option key={d.ubigeo} value={d.ubigeo}>
              {d.nombre} ({d.departamento})
            </option>
          ))}
        </select>
      </header>

      {/* Cuerpo: en móvil apila (mapa arriba, panel abajo, la página scrollea);
          en md+ lado a lado a altura completa con panel scrolleable */}
      <div className="flex flex-1 flex-col md:min-h-0 md:flex-row">
        <div className="relative h-[50vh] w-full shrink-0 md:h-auto md:min-h-0 md:flex-1">
          <MapView
            districts={districts}
            selected={selected?.ubigeo ?? null}
            onSelect={(ubigeo, nombre) => setSelected({ ubigeo, nombre })}
          />
          <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] max-w-[60%] sm:max-w-none">
            <Legend />
          </div>
        </div>

        <aside className="w-full border-t bg-background md:w-[24rem] md:min-h-0 md:overflow-hidden md:border-l md:border-t-0">
          <DistrictPanel
            ubigeo={selected?.ubigeo ?? null}
            nombre={selected?.nombre ?? null}
            district={selectedDistrict}
            checklists={checklists}
            enfen={enfen}
          />
        </aside>
      </div>

      {/* Disclaimer */}
      <footer className="border-t px-4 py-2 text-center text-[11px] text-muted-foreground">
        Información de referencia; no reemplaza a las autoridades oficiales (INDECI / ENFEN). Datos:
        SINPAD-INDECI 2003–2020.
      </footer>
    </div>
  )
}
