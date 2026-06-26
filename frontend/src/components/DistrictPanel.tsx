'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { MemoryRibbon } from '@/components/MemoryRibbon'
import {
  ENFEN_SUMMARY,
  LEVEL_LABEL,
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
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  )
}

function nivelBadgeVariant(nivel: string) {
  if (nivel === 'alto') return 'destructive' as const
  if (nivel === 'sin_registro') return 'secondary' as const
  return 'outline' as const
}

// Racha más larga de años consecutivos con emergencia.
function longestStreak(anios: number[]) {
  const s = [...anios].sort((a, b) => a - b)
  let best = s.length ? 1 : 0
  let cur = 1
  for (let i = 1; i < s.length; i++) {
    cur = s[i] === s[i - 1] + 1 ? cur + 1 : 1
    if (cur > best) best = cur
  }
  return best
}

export function DistrictPanel({ ubigeo, nombre, district, checklists, enfen }: Props) {
  const [shared, setShared] = useState(false)

  if (!ubigeo) {
    return (
      <div className="flex h-full min-h-[40vh] flex-col items-center justify-center p-8 text-center">
        <span aria-hidden className="text-3xl">📍</span>
        <p className="mt-3 font-display text-xl font-semibold text-foreground">
          Empieza por tu distrito
        </p>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Toca tu distrito en el mapa, o búscalo arriba, para ver qué le ha pasado antes, qué viene
          y qué hacer hoy.
        </p>
      </div>
    )
  }

  const nivel = district ? district.nivel : 'sin_registro'
  const checklist = checklists?.niveles[nivel] ?? []
  const titulo = district?.nombre ?? nombre ?? 'Distrito'
  const enfenData = enfen ?? ENFEN_SUMMARY
  const streak = district ? longestStreak(district.anios) : 0
  const tuvo2017 = district?.anios.includes(2017)

  async function share() {
    const text = district
      ? `Mi distrito ${district.nombre} tuvo emergencias por lluvia en ${district.anios.length} años. Hay Alerta de El Niño Costero — preparémonos.`
      : 'Vigía — preparémonos ante El Niño Costero.'
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Vigía', text, url })
      } catch {
        /* cancelado */
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(`${text} ${url}`.trim())
      setShared(true)
      setTimeout(() => setShared(false), 2500)
    }
  }

  return (
    <div className="flex flex-col gap-5 p-5">
      <header>
        <Eyebrow>Tu distrito</Eyebrow>
        <div className="mt-0.5 flex items-start justify-between gap-2">
          <h2 className="font-display text-3xl font-semibold leading-none">{titulo}</h2>
          <Badge variant={nivelBadgeVariant(nivel)} className="mt-1 shrink-0">
            {LEVEL_LABEL[nivel]}
          </Badge>
        </div>
        {district && (
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {district.departamento} · ubigeo {district.ubigeo}
          </p>
        )}
      </header>

      {/* MEMORIA — frase humana + puntos por año */}
      <section>
        <Eyebrow>Memoria</Eyebrow>
        {district ? (
          <>
            <p className="mt-2 text-lg font-semibold leading-snug">
              Tu distrito tuvo emergencias por lluvia en{' '}
              <span className="text-oxblood">{district.anios.length} años</span> entre{' '}
              {district.anios[0]} y {district.anios[district.anios.length - 1]}.
            </p>
            <div className="mt-4">
              <MemoryRibbon anios={district.anios} />
            </div>
            <p className="mt-3 text-sm leading-snug text-muted-foreground">
              {tuvo2017 && (
                <>
                  El <strong className="text-foreground">2017</strong>, el del Niño Costero, fue el
                  golpe más fuerte.{' '}
                </>
              )}
              {streak >= 3 && <>Hasta {streak} años seguidos con emergencias. </>}
              Casi siempre por lluvias intensas e inundaciones.
            </p>
          </>
        ) : (
          <p className="mt-2 text-base leading-snug">
            Sin emergencias registradas en SINPAD.{' '}
            <strong className="text-foreground">No significa sin riesgo</strong> — la prevención
            sigue aplicando.
          </p>
        )}
      </section>

      {/* AHORA — banda de alerta ENFEN (yuxtapuesta, sin fórmula) */}
      <section className="overflow-hidden rounded-2xl text-white" style={{ background: '#C2410C' }}>
        <div className="p-4">
          <div className="flex items-center gap-3">
            <span aria-hidden className="text-2xl leading-none">
              ⚠️
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/70">
                Ahora
              </p>
              <p className="font-display text-lg font-semibold leading-tight">
                {enfenData.estado}
              </p>
            </div>
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-white/95">{enfenData.resumen}</p>
          <p className="mt-2 text-[11px] text-white/70">
            Fuente: {enfenData.fecha} · resumido por IA
          </p>
        </div>
      </section>

      {/* QUÉ HACER — checklist ciudadano (emoji + detalle, táctil) */}
      <section>
        <Eyebrow>Qué hacer hoy</Eyebrow>
        <p className="mb-3 mt-1 text-sm text-muted-foreground">
          Pasos simples recomendados por INDECI para tu nivel de riesgo.
        </p>
        <ul className="space-y-2.5">
          {checklist.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
            >
              <span aria-hidden className="text-2xl leading-none">
                {item.emoji}
              </span>
              <div className="min-h-[1.5rem]">
                <p className="text-sm font-semibold leading-snug">{item.titulo}</p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{item.detalle}</p>
              </div>
            </li>
          ))}
        </ul>
        {checklists && (
          <p className="mt-3 text-[11px] leading-tight text-muted-foreground">
            {checklists.disclaimer}
          </p>
        )}
      </section>

      {/* ACCIÓN FINAL — agencia, no miedo */}
      <button
        onClick={share}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-canvas transition-opacity hover:opacity-90"
      >
        {shared ? '¡Copiado para compartir!' : '📲 Compartir con mi familia'}
      </button>
    </div>
  )
}
