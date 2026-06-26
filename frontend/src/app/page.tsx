'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Legend } from '@/components/Legend'
import { DistrictPanel } from '@/components/DistrictPanel'
import type { Checklists, District } from '@/lib/vigia'

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
  const [selected, setSelected] = useState<{ ubigeo: string; nombre: string } | null>(null)

  useEffect(() => {
    fetch('/data/districts.json')
      .then((r) => r.json())
      .then((rows: District[]) =>
        setDistricts(Object.fromEntries(rows.map((d) => [d.ubigeo, d])))
      )
    fetch('/data/checklists.json')
      .then((r) => r.json())
      .then(setChecklists)
  }, [])

  const options = useMemo(
    () =>
      Object.values(districts).sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es')
      ),
    [districts]
  )

  const selectedDistrict = selected ? districts[selected.ubigeo] ?? null : null

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 border-b px-5 py-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            Vigía <span className="font-normal text-muted-foreground">· costa norte</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Tu distrito, cuántas veces se inundó, y qué hacer hoy.
          </p>
        </div>
        {/* Dropdown de respaldo (decisión #8) */}
        <select
          className="h-9 max-w-[14rem] rounded-md border border-input bg-background px-3 text-sm"
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

      {/* Cuerpo: mapa + panel */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="relative min-h-[45vh] flex-1">
          <MapView
            districts={districts}
            selected={selected?.ubigeo ?? null}
            onSelect={(ubigeo, nombre) => setSelected({ ubigeo, nombre })}
          />
          <div className="pointer-events-none absolute bottom-4 left-4 z-[1000]">
            <Legend />
          </div>
        </div>

        <aside className="w-full shrink-0 overflow-hidden border-t bg-background md:w-[24rem] md:border-l md:border-t-0">
          <DistrictPanel
            ubigeo={selected?.ubigeo ?? null}
            nombre={selected?.nombre ?? null}
            district={selectedDistrict}
            checklists={checklists}
          />
        </aside>
      </div>

      {/* Disclaimer */}
      <footer className="border-t px-5 py-2 text-center text-[11px] text-muted-foreground">
        Información de referencia; no reemplaza a las autoridades oficiales (INDECI / ENFEN).
        Datos: SINPAD-INDECI 2003–2020.
      </footer>
    </div>
  )
}
