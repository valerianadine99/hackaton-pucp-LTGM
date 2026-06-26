// Signature de Vigía: "memoria por años" en puntos (estilo conversación, no gráfico de analista).
// El 2017 (Niño Costero) se resalta grande y rojo si el distrito lo vivió.
const START = 2003
const END = 2020
const PEAK = 2017

export function MemoryRibbon({ anios }: { anios: number[] }) {
  const hit = new Set(anios)
  const years = Array.from({ length: END - START + 1 }, (_, i) => START + i)

  return (
    <div className="flex items-end justify-between gap-1">
      {years.map((y) => {
        const on = hit.has(y)
        const peak = on && y === PEAK
        const showLabel = y === START || y === END || peak
        return (
          <div key={y} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              title={`${y}${on ? ' · emergencia' : ''}`}
              className={`rounded-full transition-all ${
                peak
                  ? 'bg-oxblood ring-4 ring-oxblood/20'
                  : on
                    ? 'bg-ember'
                    : 'bg-sand/50'
              }`}
              style={{
                width: peak ? 18 : on ? 11 : 6,
                height: peak ? 18 : on ? 11 : 6,
              }}
            />
            <span
              className={`font-mono text-[9px] leading-none ${
                peak ? 'font-semibold text-oxblood' : 'text-muted-foreground'
              } ${showLabel ? '' : 'invisible'}`}
            >
              {String(y).slice(2)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
