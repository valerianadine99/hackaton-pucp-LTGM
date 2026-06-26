'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Legend } from '@/components/Legend'
import { DistrictPanel, enfenSegLabel } from '@/components/DistrictPanel'
import type { Checklists, District, EnfenSummary } from '@/lib/vigia'
import { loadDistricts } from '@/lib/vigia-api'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm font-semibold text-muted-foreground">
      Cargando mapa…
    </div>
  ),
})

type Sel = { ubigeo: string; nombre: string } | null

// Ray-casting point-in-polygon para Polygon/MultiPolygon GeoJSON ([lng,lat]).
function pointInRing(x: number, y: number, ring: number[][]) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
function pointInFeature(lng: number, lat: number, geom: any) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates
  for (const poly of polys) {
    if (pointInRing(lng, lat, poly[0])) {
      let inHole = false
      for (let k = 1; k < poly.length; k++) if (pointInRing(lng, lat, poly[k])) inHole = true
      if (!inHole) return true
    }
  }
  return false
}

function Logo({ size = 21 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="#9fdcec" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.4" stroke="#9fdcec" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="1.7" fill="#f0a93a" />
    </svg>
  )
}

function BrandHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="z-[1100] flex items-center justify-between gap-4 bg-ink px-4 pb-3.5 pt-3.5 text-white">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#15596d] ring-1 ring-white/15">
          <Logo />
        </div>
        <div>
          <div className="text-[19px] font-extrabold leading-none">
            Vigía<span className="text-gold">.</span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-[#a9c6cf]">
            Memoria y alerta · El Niño · Costa norte
          </div>
        </div>
      </div>
      {children}
    </header>
  )
}

function StepBar({
  title,
  badge,
  onBack,
}: {
  title: string
  badge?: string
  onBack: () => void
}) {
  return (
    <header className="z-[1100] flex items-center justify-between gap-3 bg-ink px-4 pb-3.5 pt-3.5 text-white">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="Volver"
          className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#15596d] ring-1 ring-white/15"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M14 6l-6 6 6 6"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="text-base font-extrabold">{title}</span>
      </div>
      {badge && (
        <span className="flex items-center gap-1.5 rounded-full border border-white/12 bg-[#d23b3b]/20 px-3 py-1 text-[11.5px] font-extrabold text-[#ffd2d2]">
          <span className="h-[7px] w-[7px] rounded-full bg-[#ff6b6b]" />
          {badge}
        </span>
      )}
    </header>
  )
}

export default function Home() {
  const [districts, setDistricts] = useState<Record<string, District>>({})
  const [checklists, setChecklists] = useState<Checklists | null>(null)
  const [enfen, setEnfen] = useState<EnfenSummary | null>(null)
  const [selected, setSelected] = useState<Sel>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1) // paso móvil
  const [isDesktop, setIsDesktop] = useState(false)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    // Distritos desde la API en vivo (BD vía backend). Checklists y ENFEN siguen en
    // estático por ahora (no hay endpoint de checklists y el resumen ENFEN requiere la
    // API key de Claude); se conectan en la siguiente fase.
    loadDistricts()
      .then(setDistricts)
      .catch((e) => console.error('No se pudo cargar distritos de la API:', e))
    fetch('/data/checklists.json').then((r) => r.json()).then(setChecklists)
    fetch('/data/enfen.json').then((r) => r.json()).then(setEnfen)
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
  const selectedDistrict = selected ? districts[selected.ubigeo] ?? null : null
  const segLabel = enfenSegLabel(enfen?.estado)
  const hasData = options.length > 0

  function pick(s: Sel) {
    setSelected(s)
    setStep(2)
  }

  async function useMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords
          const gj = await fetch('/data/northcoast.geojson').then((r) => r.json())
          const f = gj.features.find((ft: any) => pointInFeature(lng, lat, ft.geometry))
          if (f) {
            const u = f.properties.ubigeo
            pick({ ubigeo: u, nombre: districts[u]?.nombre ?? f.properties.nombre })
          } else {
            alert('Por ahora Vigía cubre la costa norte. Elige tu distrito en la lista.')
          }
        } finally {
          setLocating(false)
        }
      },
      () => {
        setLocating(false)
        alert('No pudimos obtener tu ubicación. Elige tu distrito en la lista.')
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const districtSelect = (
    <div className="flex items-center gap-3 rounded-[13px] border-[1.5px] border-[#d4dbe0] bg-white px-3.5 py-3.5">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
        <path
          d="M12 21s-7-6.4-7-11a7 7 0 1 1 14 0c0 4.6-7 11-7 11Z"
          stroke="#0f3a47"
          strokeWidth="1.7"
        />
        <circle cx="12" cy="10" r="2.4" stroke="#0f3a47" strokeWidth="1.7" />
      </svg>
      <select
        value={selected?.ubigeo ?? ''}
        onChange={(e) => {
          const d = districts[e.target.value]
          if (d) pick({ ubigeo: d.ubigeo, nombre: d.nombre })
        }}
        className="flex-1 bg-transparent text-base font-semibold text-ink focus:outline-none"
      >
        <option value="">Elige tu distrito</option>
        {options.map((d) => (
          <option key={d.ubigeo} value={d.ubigeo}>
            {d.nombre} ({d.departamento})
          </option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper md:h-[100dvh] md:overflow-hidden">
      {/* ===================== MÓVIL: 3 pasos ===================== */}
      <div className="flex flex-1 flex-col md:hidden">
        {step === 1 && (
          <>
            <BrandHeader />
            <div className="flex flex-1 flex-col">
              <div className="px-4 pb-3 pt-4">
                <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.06em] text-[#5d6873]">
                  ¿Dónde vives?
                </p>
                {districtSelect}
                <button
                  onClick={useMyLocation}
                  className="mt-2.5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[13px] bg-ink text-[14.5px] font-bold text-white disabled:opacity-70"
                  disabled={locating}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" stroke="#fff" strokeWidth="1.7" />
                    <path
                      d="M12 2v3M12 19v3M2 12h3M19 12h3"
                      stroke="#fff"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                  {locating ? 'Ubicándote…' : 'Usar mi ubicación'}
                </button>
              </div>
              <div className="relative mx-4 mt-1 min-h-[340px] flex-1 overflow-hidden rounded-t-[18px] border border-b-0 border-[#d8e0e4] bg-[#dfe6ea]">
                {!isDesktop && hasData && (
                  <MapView
                    districts={districts}
                    selected={null}
                    onSelect={(ubigeo, nombre) => pick({ ubigeo, nombre })}
                  />
                )}
                <div className="absolute bottom-3.5 left-2.5 z-[600]">
                  <Legend />
                </div>
              </div>
            </div>
          </>
        )}

        {step === 2 && selected && (
          <>
            <StepBar
              title="Tu distrito"
              onBack={() => {
                setSelected(null)
                setStep(1)
              }}
            />
            <div className="flex-1 overflow-y-auto">
              <DistrictPanel
                view="history"
                ubigeo={selected.ubigeo}
                nombre={selected.nombre}
                district={selectedDistrict}
                checklists={checklists}
                enfen={enfen}
              />
            </div>
            <div className="border-t border-border bg-white px-4 py-3">
              <button
                onClick={() => setStep(3)}
                className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-ink text-[15px] font-extrabold text-white"
              >
                Ver qué hacer hoy →
              </button>
            </div>
          </>
        )}

        {step === 3 && selected && (
          <>
            <StepBar title={selected.nombre} badge={segLabel} onBack={() => setStep(2)} />
            <div className="flex-1 overflow-y-auto">
              <DistrictPanel
                view="action"
                ubigeo={selected.ubigeo}
                nombre={selected.nombre}
                district={selectedDistrict}
                checklists={checklists}
                enfen={enfen}
              />
            </div>
          </>
        )}
      </div>

      {/* ===================== DESKTOP: mapa (clímax) + panel ===================== */}
      <div className="hidden md:flex md:h-full md:flex-col">
        <BrandHeader>
          <select
            className="h-9 w-60 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold"
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
        </BrandHeader>
        <div className="flex min-h-0 flex-1">
          <div className="relative min-h-0 flex-1">
            {isDesktop && hasData && (
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
                <span className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white shadow-lg">
                  Haz clic en tu distrito
                </span>
              </div>
            )}
          </div>
          <aside className="w-[26rem] shrink-0 overflow-y-auto border-l border-border bg-paper">
            <DistrictPanel
              view="all"
              ubigeo={selected?.ubigeo ?? null}
              nombre={selected?.nombre ?? null}
              district={selectedDistrict}
              checklists={checklists}
              enfen={enfen}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}
