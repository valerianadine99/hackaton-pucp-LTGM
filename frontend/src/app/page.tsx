'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Legend } from '@/components/Legend'
import { DistrictPanel } from '@/components/DistrictPanel'
import type { Checklists, District, EnfenSummary } from '@/lib/vigia'
import { loadChecklists, loadDistricts, loadEnfen } from '@/lib/vigia-api'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center font-mono text-sm text-muted-foreground">
      Cargando mapa…
    </div>
  ),
})

type Sel = { ubigeo: string; nombre: string } | null

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className="shrink-0">
        <circle cx="12" cy="12" r="10" fill="none" stroke="#EA7B27" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="5.5" fill="none" stroke="#EA7B27" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="1.6" fill="#EA7B27" />
      </svg>
      <h1 className="font-display text-xl font-semibold leading-none">
        Vigía <span className="font-sans text-sm font-normal text-canvas/70">· costa norte</span>
      </h1>
    </div>
  )
}

// Entrada móvil: hero + buscador grande + chips de los más golpeados. Sin mapa.
function MobileEntry({
  options,
  top,
  onPick,
}: {
  options: District[]
  top: District[]
  onPick: (s: Sel) => void
}) {
  return (
    <div className="flex flex-1 flex-col bg-ink px-6 pb-8 pt-4 text-canvas">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-canvas/55">
          Alerta temprana · El Niño
        </p>
        <h2 className="mt-3 font-display text-[1.9rem] font-semibold leading-[1.15]">
          ¿Qué le pasa a tu distrito cuando llueve?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-canvas/75">
          Mira su historial real de inundaciones y qué hacer hoy. Tu distrito, en 10 segundos.
        </p>

        <label className="mt-7 block font-mono text-[11px] uppercase tracking-[0.16em] text-canvas/55">
          Elige tu distrito
        </label>
        <select
          value=""
          onChange={(e) => {
            const d = options.find((o) => o.ubigeo === e.target.value)
            if (d) onPick({ ubigeo: d.ubigeo, nombre: d.nombre })
          }}
          className="mt-2 h-14 w-full rounded-xl border border-canvas/20 bg-canvas/10 px-4 text-base text-canvas focus:outline-none focus:ring-2 focus:ring-ember"
        >
          <option value="">Busca tu distrito…</option>
          {options.map((d) => (
            <option key={d.ubigeo} value={d.ubigeo} className="text-foreground">
              {d.nombre} ({d.departamento})
            </option>
          ))}
        </select>

        {top.length > 0 && (
          <>
            <p className="mt-7 text-xs text-canvas/55">O mira los más golpeados:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {top.map((d) => (
                <button
                  key={d.ubigeo}
                  onClick={() => onPick({ ubigeo: d.ubigeo, nombre: d.nombre })}
                  className="flex min-h-[44px] items-center gap-2 rounded-full border border-canvas/25 bg-canvas/5 px-4 text-sm text-canvas active:bg-canvas/15"
                >
                  {d.nombre}
                  <span className="font-mono text-xs text-ember">{d.conteo}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <p className="pt-6 text-center font-mono text-[10px] text-canvas/40">
        {options.length} distritos · datos reales SINPAD 2003–2020
      </p>
    </div>
  )
}

export default function Home() {
  const [districts, setDistricts] = useState<Record<string, District>>({})
  const [checklists, setChecklists] = useState<Checklists | null>(null)
  const [enfen, setEnfen] = useState<EnfenSummary | null>(null)
  const [selected, setSelected] = useState<Sel>(null)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    // Todo desde la API en vivo (BD vía backend) — sin archivos estáticos (Principio VIII).
    loadDistricts()
      .then(setDistricts)
      .catch((e) => console.error('No se pudo cargar distritos:', e))
    loadChecklists()
      .then(setChecklists)
      .catch((e) => console.error('No se pudo cargar checklists:', e))
    loadEnfen()
      .then(setEnfen)
      .catch((e) => console.error('No se pudo cargar ENFEN:', e))
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const options = useMemo(
    () => Object.values(districts).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [districts]
  )
  const topDistricts = useMemo(
    () => Object.values(districts).sort((a, b) => b.conteo - a.conteo).slice(0, 5),
    [districts]
  )
  const selectedDistrict = selected ? districts[selected.ubigeo] ?? null : null

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background md:h-[100dvh] md:overflow-hidden">
      {/* Brand bar */}
      <header className="z-[1100] flex items-center justify-between gap-4 bg-ink px-4 py-3 text-canvas">
        <div>
          <Wordmark />
          <p className="mt-0.5 text-xs text-canvas/70">
            Tu distrito, cuántas veces se inundó, y qué hacer hoy.
          </p>
        </div>
        {/* Buscador en header solo en desktop */}
        <select
          className="hidden h-9 w-60 rounded-lg border border-canvas/20 bg-canvas/10 px-3 text-sm text-canvas focus:outline-none focus:ring-2 focus:ring-ember md:block"
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

      {/* ===== MÓVIL: flujo ciudadano, sin mapa ===== */}
      <div className="flex flex-1 flex-col md:hidden">
        {!selected ? (
          <MobileEntry options={options} top={topDistricts} onPick={setSelected} />
        ) : (
          <div className="flex flex-1 flex-col">
            <button
              onClick={() => setSelected(null)}
              className="flex min-h-[44px] items-center gap-1.5 border-b border-border px-4 text-sm font-medium text-muted-foreground"
            >
              ← Ver otro distrito
            </button>
            <DistrictPanel
              ubigeo={selected.ubigeo}
              nombre={selected.nombre}
              district={selectedDistrict}
              checklists={checklists}
              enfen={enfen}
            />
          </div>
        )}
      </div>

      {/* ===== DESKTOP: mapa (clímax) + panel ===== */}
      <div className="hidden min-h-0 flex-1 md:flex">
        <div className="relative min-h-0 flex-1">
          {isDesktop && (
            <MapView
              districts={districts}
              selected={selected?.ubigeo ?? null}
              onSelect={(ubigeo, nombre) => setSelected({ ubigeo, nombre })}
            />
          )}
          <div className="pointer-events-none absolute left-3 top-3 z-[1000]">
            <Legend />
          </div>
          {!selected && (
            <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
              <span className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-canvas shadow-lg">
                Haz clic en tu distrito
              </span>
            </div>
          )}
        </div>
        <aside className="w-[26rem] shrink-0 overflow-y-auto border-l border-border bg-card">
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
