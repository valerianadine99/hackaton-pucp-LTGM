import { LEVEL_COLOR, LEVEL_LABEL, type Nivel } from '@/lib/vigia'

const ORDER: Nivel[] = ['alto', 'medio', 'bajo', 'sin_registro']

export function Legend() {
  return (
    <div className="rounded-xl border border-border bg-white/95 p-3 shadow-md backdrop-blur">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#16202a]">
        Emergencias registradas · 2003–2020
      </p>
      <ul className="mt-2 space-y-1.5">
        {ORDER.map((n) => (
          <li key={n} className="flex items-center gap-2 text-xs font-medium text-[#384450]">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: LEVEL_COLOR[n] }}
            />
            {LEVEL_LABEL[n]}
          </li>
        ))}
      </ul>
      <p className="mt-2 max-w-[12rem] text-[10px] leading-tight text-muted-foreground">
        Conteo crudo (SINPAD), sin normalizar por población.
      </p>
    </div>
  )
}
