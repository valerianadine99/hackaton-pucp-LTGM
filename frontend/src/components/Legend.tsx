import { LEVEL_COLOR, LEVEL_LABEL, type Nivel } from '@/lib/vigia'

const ORDER: Nivel[] = ['alto', 'medio', 'bajo', 'sin_registro']

export function Legend() {
  return (
    <div className="rounded-xl border border-border bg-card/90 p-3 shadow-sm backdrop-blur">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Emergencias por lluvia · 2003–2020
      </p>
      <ul className="mt-2 space-y-1">
        {ORDER.map((n) => (
          <li key={n} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block h-3 w-3 rounded-[3px]"
              style={{ backgroundColor: LEVEL_COLOR[n] }}
            />
            <span className="text-foreground/80">{LEVEL_LABEL[n]}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 max-w-[12rem] text-[10px] leading-tight text-muted-foreground">
        Conteo crudo (SINPAD), sin normalizar por población.
      </p>
    </div>
  )
}
