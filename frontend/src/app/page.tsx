'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Legend } from '@/components/Legend'
import { DistrictPanel } from '@/components/DistrictPanel'
import type { Checklists, District, EnfenSummary } from '@/lib/vigia'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center font-mono text-sm text-muted-foreground">
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
      .then((rows: District[]) => setDistricts(Object.fromEntries(rows.map((d) => [d.ubigeo, d]))))
    fetch('/data/checklists.json').then((r) => r.json()).then(setChecklists)
    fetch('/data/enfen.json').then((r) => r.json()).then(setEnfen)
  }, [])

  const options = useMemo(
    () => Object.values(districts).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [districts]
  )
  const selectedDistrict = selected ? districts[selected.ubigeo] ?? null : null

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background md:h-[100dvh] md:overflow-hidden">
      {/* Brand bar — teal "marea" */}
      <header className="z-[1100] flex flex-col gap-2 bg-ink px-4 py-3 text-canvas sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className="shrink-0">
            <circle cx="12" cy="12" r="10" fill="none" stroke="#EA7B27" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="5.5" fill="none" stroke="#EA7B27" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="1.6" fill="#EA7B27" />
          </svg>
          <div>
            <h1 className="font-display text-xl font-semibold leading-none">
              Vigía <span className="font-sans text-sm font-normal text-canvas/70">· costa norte</span>
            </h1>
            <p className="mt-0.5 text-xs text-canvas/70">
              Tu distrito, cuántas veces se inundó, y qué hacer hoy.
            </p>
          </div>
        </div>
        <select
          className="h-10 w-full rounded-lg border border-canvas/20 bg-canvas/10 px-3 text-sm text-canvas placeholder:text-canvas/60 focus:outline-none focus:ring-2 focus:ring-ember sm:h-9 sm:w-60"
          value={selected?.ubigeo ?? ''}
          onChange={(e) => {
            const d = districts[e.target.value]
            if (d) setSelected({ ubigeo: d.ubigeo, nombre: d.nombre })
          }}
        >
          <option value="">Busca tu distrito…</option>
          {options.map((d) => (
            <option key={d.ubigeo} value={d.ubigeo} className="text-foreground">
              {d.nombre} ({d.departamento})
            </option>
          ))}
        </select>
      </header>

      <div className="relative flex flex-1 flex-col md:min-h-0 md:flex-row">
        {/* Mapa (hero) */}
        <div className="relative min-h-0 flex-1">
          <MapView
            districts={districts}
            selected={selected?.ubigeo ?? null}
            onSelect={(ubigeo, nombre) => setSelected({ ubigeo, nombre })}
          />
          <div className="pointer-events-none absolute left-3 top-3 z-[1000] max-w-[58%] sm:max-w-none">
            <Legend />
          </div>
          {/* Hint flotante en móvil cuando no hay selección */}
          {!selected && (
            <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center md:hidden">
              <span className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-canvas shadow-lg">
                Toca tu distrito 👆
              </span>
            </div>
          )}
        </div>

        {/* Panel: bottom-sheet en móvil, rail fijo en desktop */}
        <aside
          className={`fixed inset-x-0 bottom-0 z-[1200] max-h-[82vh] overflow-y-auto rounded-t-2xl border-t border-border bg-card shadow-[0_-10px_40px_rgba(7,48,46,0.22)] transition-transform duration-300 ease-out md:static md:max-h-none md:w-[26rem] md:translate-y-0 md:overflow-y-auto md:rounded-none md:border-l md:border-t-0 md:shadow-none ${
            selected ? 'translate-y-0' : 'translate-y-full md:translate-y-0'
          }`}
        >
          {/* Handle + cerrar (solo móvil) */}
          {selected && (
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-4 py-2 backdrop-blur md:hidden">
              <span className="mx-auto h-1 w-10 rounded-full bg-border" />
              <button
                onClick={() => setSelected(null)}
                className="absolute right-3 text-sm font-medium text-muted-foreground"
              >
                Cerrar
              </button>
            </div>
          )}
          <DistrictPanel
            ubigeo={selected?.ubigeo ?? null}
            nombre={selected?.nombre ?? null}
            district={selectedDistrict}
            checklists={checklists}
            enfen={enfen}
          />
        </aside>
      </div>

      <footer className="border-t border-border bg-background px-4 py-2 text-center font-mono text-[10px] text-muted-foreground">
        Información de referencia; no reemplaza a las autoridades oficiales (INDECI / ENFEN) · Datos:
        SINPAD-INDECI 2003–2020
      </footer>
    </div>
  )
}
