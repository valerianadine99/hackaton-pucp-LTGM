'use client'

import { useEffect, useState } from 'react'
import {
  ENFEN_SUMMARY,
  type Checklists,
  type District,
  type EnfenSummary,
} from '@/lib/vigia'

interface Props {
  ubigeo: string | null
  nombre: string | null
  district: District | null // null + ubigeo => distrito sin registro
  checklists: Checklists | null
  enfen: EnfenSummary | null
  // 'all' = desktop (todo); 'history' = paso 2 (qué pasó + qué viene); 'action' = paso 3 (qué hacer + compartir)
  view?: 'all' | 'history' | 'action'
}

const SHARE_URL = 'vigia-costa-norte.vercel.app'

const SEGMENTS = [
  { label: 'Sin reg.', color: '#9aa3ab' },
  { label: 'Vigilancia', color: '#1f6486' },
  { label: 'Alerta', color: '#c2691a' },
  { label: 'Alarma', color: '#d23b3b' },
]
const STATE_TITLE = [
  'Sin alerta vigente',
  'Vigilancia — mantente informado',
  'Alerta — prepárate hoy',
  'Alarma — actúa hoy',
]
export function enfenIndex(estado?: string) {
  const e = (estado ?? '').toLowerCase()
  if (e.includes('alarma')) return 3
  if (e.includes('alerta')) return 2
  if (e.includes('vigilancia')) return 1
  return 0
}
export function enfenSegLabel(estado?: string) {
  return SEGMENTS[enfenIndex(estado)].label
}

function BlockHead({ n, title, dark }: { n: number; title: string; dark?: boolean }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-extrabold ${
          dark ? 'bg-ink text-white' : 'bg-[#eef1f3] text-ink'
        }`}
      >
        {n}
      </span>
      <span className="text-xs font-extrabold tracking-wide text-[#16202a]">{title}</span>
    </div>
  )
}

export function DistrictPanel({
  ubigeo,
  nombre,
  district,
  checklists,
  enfen,
  view = 'all',
}: Props) {
  const [done, setDone] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (!ubigeo) return
    try {
      const raw = localStorage.getItem(`vigia:check:${ubigeo}`)
      setDone(raw ? JSON.parse(raw) : {})
    } catch {
      setDone({})
    }
  }, [ubigeo])

  function toggle(i: number) {
    setDone((prev) => {
      const next = { ...prev, [i]: !prev[i] }
      try {
        if (ubigeo) localStorage.setItem(`vigia:check:${ubigeo}`, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  if (!ubigeo) {
    return (
      <div className="flex h-full min-h-[40vh] flex-col items-center justify-center p-8 text-center">
        <span aria-hidden className="text-3xl">📍</span>
        <p className="mt-3 text-xl font-extrabold text-ink">Empieza por tu distrito</p>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Toca tu distrito en el mapa, o búscalo arriba, para ver qué le ha pasado antes, qué viene
          y qué hacer hoy.
        </p>
      </div>
    )
  }

  const enfenData = enfen ?? ENFEN_SUMMARY
  const idx = enfenIndex(enfenData.estado)
  const seg = SEGMENTS[idx]
  const titulo = district?.nombre ?? nombre ?? 'Distrito'
  const nivel = district ? district.nivel : 'sin_registro'
  const checklist = checklists?.niveles[nivel] ?? []
  const doneCount = checklist.reduce((acc, _, i) => acc + (done[i] ? 1 : 0), 0)
  const pct = checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0

  const shareText = district
    ? `Mi distrito ${district.nombre} tuvo emergencias por lluvia en ${district.anios.length} años. Hay ${enfenData.estado} — preparémonos hoy. ${SHARE_URL}`
    : `${enfenData.estado} en la costa norte — preparémonos. ${SHARE_URL}`
  const waLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`

  const showHistory = view !== 'action'
  const showAction = view !== 'history'

  return (
    <div className="flex flex-col gap-3 bg-paper p-4 pb-8">
      {showHistory && (
        <>
          {/* Header card */}
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#8a949d]">
                  Tu distrito
                </p>
                <h2 className="mt-0.5 text-[28px] font-black leading-none tracking-tight text-ink">
                  {titulo}
                </h2>
                {district && (
                  <p className="mt-1 text-[13px] font-semibold text-[#5d6873]">
                    {district.departamento}, Perú
                  </p>
                )}
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#f1c4c4] bg-[#fbeaea] px-3 py-1.5 text-[12.5px] font-extrabold text-floodHigh">
                <span className="h-2 w-2 animate-pulse rounded-full bg-floodHigh" />
                {seg.label}
              </span>
            </div>
          </div>

          {/* 1 — QUÉ TE HA PASADO ANTES */}
          <div className="rounded-2xl border border-border bg-white p-4">
            <BlockHead n={1} title="QUÉ TE HA PASADO ANTES" />
            {district ? (
              <>
                <div className="flex items-baseline gap-3">
                  <span className="text-[56px] font-black leading-[0.82] tracking-tighter text-floodHigh">
                    {district.conteo}
                  </span>
                  <span className="text-sm font-semibold leading-snug text-[#384450]">
                    veces se registró una emergencia por lluvias o inundación
                  </span>
                </div>
                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.05em] text-[#8a949d]">
                    Años con eventos
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {district.anios.map((y) => (
                      <span
                        key={y}
                        className="rounded-lg border border-[#dde6ea] bg-[#eef3f5] px-2.5 py-1 text-[13px] font-bold text-ink"
                      >
                        {y}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-base font-medium leading-snug text-[#16202a]">
                Sin emergencias registradas en SINPAD. <strong>No significa sin riesgo</strong> — la
                prevención sigue aplicando.
              </p>
            )}
          </div>

          {/* 2 — QUÉ VIENE — ESTADO ENFEN */}
          <div
            className="rounded-2xl border border-border bg-white p-4"
            style={{ borderLeft: `5px solid ${seg.color}` }}
          >
            <BlockHead n={2} title="QUÉ VIENE — ESTADO ENFEN" />
            <p className="text-xl font-black leading-tight" style={{ color: seg.color }}>
              {STATE_TITLE[idx]}
            </p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[#384450]">{enfenData.resumen}</p>
            <div className="mt-4 flex gap-1.5">
              {SEGMENTS.map((s, i) => (
                <div key={s.label} className="flex-1 text-center">
                  <div
                    className="h-2 rounded-full"
                    style={{ background: i <= idx ? s.color : '#e4e8eb' }}
                  />
                  <div
                    className="mt-1.5 text-[9.5px] font-bold"
                    style={{ color: i === idx ? s.color : '#aab2b9' }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-[#8a949d]">
              Fuente: {enfenData.fecha} · resumido por IA
            </p>
          </div>
        </>
      )}

      {showAction && (
        <>
          {/* 3 — QUÉ HACER HOY (interactivo) */}
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-center justify-between">
              <BlockHead n={3} title="QUÉ HACER HOY" dark />
              <span className="text-xs font-bold text-[#5d6873]">
                {doneCount}/{checklist.length} listo
              </span>
            </div>
            <div className="mb-1 mt-2 h-1.5 overflow-hidden rounded-full bg-[#eef1f3]">
              <div
                className="h-full rounded-full bg-[#1f7a4d] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <ul>
              {checklist.map((item, i) => (
                <li key={i}>
                  <button
                    onClick={() => toggle(i)}
                    className="flex w-full items-start gap-3 border-b border-[#f0f2f4] py-3 text-left"
                    aria-pressed={!!done[i]}
                  >
                    <span
                      className="mt-0.5 flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-md border-2"
                      style={{
                        borderColor: done[i] ? '#1f7a4d' : '#cdd5db',
                        background: done[i] ? '#1f7a4d' : '#fff',
                      }}
                    >
                      {done[i] && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path
                            d="m5 13 4 4L19 7"
                            stroke="#fff"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span
                      className={`text-[13.5px] leading-snug ${
                        done[i] ? 'text-[#8a949d] line-through' : 'text-[#16202a]'
                      }`}
                    >
                      <span className="font-semibold">{item.titulo}</span>{' '}
                      <span className="font-normal text-[#5d6873]">{item.detalle}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] font-medium leading-snug text-[#8a949d]">
              Checklist curado de guías oficiales de INDECI según el nivel de riesgo.
            </p>
          </div>

          {/* Compartir */}
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="mb-2.5 flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#eaf6ea]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 11.5a8.4 8.4 0 0 1-12 7.6L3 21l1.9-6A8.4 8.4 0 1 1 21 11.5Z"
                    stroke="#1f7a4d"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-xs font-extrabold tracking-wide text-[#16202a]">
                COMPARTE CON TU FAMILIA
              </span>
            </div>
            <div className="rounded-xl rounded-bl-sm border border-[#d3ecb9] bg-[#e7f7d4] p-3 text-[12.5px] font-medium leading-relaxed text-[#243016]">
              {shareText.replace(` ${SHARE_URL}`, ' ')}
              <span className="text-[#3a6e34]">{SHARE_URL}</span>
            </div>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-whatsapp text-sm font-extrabold text-white transition-opacity hover:opacity-90"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 11.5a8.4 8.4 0 0 1-12 7.6L3 21l1.9-6A8.4 8.4 0 1 1 21 11.5Z"
                  stroke="#fff"
                  strokeWidth="1.9"
                  strokeLinejoin="round"
                />
              </svg>
              Compartir por WhatsApp
            </a>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2.5 rounded-xl bg-[#eef1f3] p-3.5">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="9.2" stroke="#6b7682" strokeWidth="1.6" />
              <path d="M12 8h.01M12 11v5" stroke="#6b7682" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <p className="text-[11.5px] font-medium leading-relaxed text-[#5d6873]">
              Información de referencia.{' '}
              <strong className="text-[#384450]">No reemplaza los comunicados oficiales</strong> de
              INDECI, ENFEN y tu municipalidad.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
