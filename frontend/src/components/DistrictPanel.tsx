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

export function DistrictPanel({ ubigeo, nombre, district, checklists, enfen }: Props) {
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

  return (
    <div className="flex flex-col gap-5 p-5">
      <header>
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-display text-2xl font-semibold leading-tight">{titulo}</h2>
          <Badge variant={nivelBadgeVariant(nivel)} className="mt-1 shrink-0">
            {LEVEL_LABEL[nivel]}
          </Badge>
        </div>
        {district && (
          <p className="font-mono text-xs text-muted-foreground">
            {district.departamento} · ubigeo {district.ubigeo}
          </p>
        )}
      </header>

      {/* MEMORIA — número grande + cinta de memoria (signature) */}
      <section>
        <Eyebrow>Memoria</Eyebrow>
        {district ? (
          <>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-5xl font-semibold leading-none text-oxblood">
                {district.conteo}
              </span>
              <span className="text-sm text-muted-foreground">
                emergencias por lluvia
              </span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {district.anios.length} año(s) con eventos, entre {district.anios[0]} y{' '}
              {district.anios[district.anios.length - 1]}.
            </p>
            <div className="mt-3">
              <MemoryRibbon anios={district.anios} />
            </div>
          </>
        ) : (
          <p className="mt-1 text-sm">
            Sin emergencias registradas en SINPAD.{' '}
            <strong className="text-foreground">No significa sin riesgo</strong> — la prevención
            sigue aplicando.
          </p>
        )}
      </section>

      {/* AHORA — estado ENFEN, yuxtapuesto (sin fórmula combinada) */}
      <section className="rounded-xl border border-border bg-secondary/50 p-4">
        <div className="flex items-center justify-between gap-2">
          <Eyebrow>Ahora</Eyebrow>
          <Badge variant="destructive" className="shrink-0">
            {enfenData.estado}
          </Badge>
        </div>
        <p className="mt-2 text-sm leading-relaxed">{enfenData.resumen}</p>
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">{enfenData.fecha}</p>
      </section>

      {/* QUÉ HACER — checklist curado INDECI */}
      <section>
        <Eyebrow>Qué hacer</Eyebrow>
        <ul className="mt-2 space-y-2.5 text-sm">
          {checklist.map((item, i) => (
            <li key={i} className="flex gap-2.5">
              <span
                aria-hidden
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-canvas"
              >
                ✓
              </span>
              <span className="leading-snug">{item}</span>
            </li>
          ))}
        </ul>
        {checklists && (
          <p className="mt-3 text-[11px] leading-tight text-muted-foreground">
            {checklists.disclaimer}
          </p>
        )}
      </section>
    </div>
  )
}
