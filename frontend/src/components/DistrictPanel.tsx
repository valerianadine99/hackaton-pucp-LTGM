import { Badge } from '@/components/ui/badge'
import {
  ENFEN_SUMMARY,
  LEVEL_LABEL,
  type Checklists,
  type District,
} from '@/lib/vigia'

interface Props {
  ubigeo: string | null
  nombre: string | null
  district: District | null // null + ubigeo => distrito sin registro
  checklists: Checklists | null
}

function nivelBadgeVariant(nivel: string) {
  if (nivel === 'alto') return 'destructive' as const
  if (nivel === 'sin_registro') return 'secondary' as const
  return 'outline' as const
}

export function DistrictPanel({ ubigeo, nombre, district, checklists }: Props) {
  if (!ubigeo) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <p className="text-lg font-medium text-foreground">Empieza por tu distrito</p>
        <p className="mt-2 max-w-xs text-sm">
          Haz clic en tu distrito en el mapa (o búscalo en la lista) para ver qué le ha pasado
          antes, qué viene y qué hacer hoy.
        </p>
      </div>
    )
  }

  const nivel = district ? district.nivel : 'sin_registro'
  const checklist = checklists?.niveles[nivel] ?? []
  const titulo = district?.nombre ?? nombre ?? 'Distrito'

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
      <header>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">{titulo}</h2>
          <Badge variant={nivelBadgeVariant(nivel)}>{LEVEL_LABEL[nivel]}</Badge>
        </div>
        {district && (
          <p className="text-sm text-muted-foreground">{district.departamento}</p>
        )}
      </header>

      {/* MEMORIA */}
      <section className="rounded-lg border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Memoria
        </p>
        {district ? (
          <>
            <p className="mt-1 text-2xl font-bold">
              {district.conteo}{' '}
              <span className="text-base font-normal text-muted-foreground">
                emergencias por lluvia
              </span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              entre {district.anios[0]} y {district.anios[district.anios.length - 1]} ·{' '}
              {district.anios.length} año(s) con eventos
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm">
            Sin emergencias registradas en SINPAD.{' '}
            <strong>No significa sin riesgo</strong> — la prevención sigue aplicando.
          </p>
        )}
      </section>

      {/* PRESENTE (ENFEN) — yuxtapuesto, sin fórmula combinada */}
      <section className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Estado actual
          </p>
          <Badge variant="destructive">{ENFEN_SUMMARY.estado}</Badge>
        </div>
        <p className="mt-2 text-sm">{ENFEN_SUMMARY.resumen}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          ENFEN · {ENFEN_SUMMARY.fecha} ·{' '}
          <span className="italic">resumen de muestra (lo generará la IA)</span>
        </p>
      </section>

      {/* ACCIÓN */}
      <section className="rounded-lg border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Qué hacer
        </p>
        <ul className="mt-2 space-y-2 text-sm">
          {checklist.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden className="mt-0.5 text-primary">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {checklists && (
          <p className="mt-3 text-[11px] text-muted-foreground">{checklists.disclaimer}</p>
        )}
      </section>
    </div>
  )
}
