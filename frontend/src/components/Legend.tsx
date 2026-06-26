import { LEVEL_COLOR, LEVEL_LABEL, type Nivel } from '@/lib/vigia'

const ORDER: Nivel[] = ['alto', 'medio', 'bajo', 'sin_registro']

export function Legend() {
  return (
    <div className="rounded-lg border bg-card/90 p-3 text-xs shadow-sm backdrop-blur">
      <p className="mb-2 font-medium">Emergencias por lluvia/inundación (2003–2020)</p>
      <ul className="space-y-1">
        {ORDER.map((n) => (
          <li key={n} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: LEVEL_COLOR[n] }}
            />
            <span className="text-muted-foreground">{LEVEL_LABEL[n]}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] leading-tight text-muted-foreground">
        Conteo crudo de emergencias (SINPAD), sin normalizar por población.
      </p>
    </div>
  )
}
