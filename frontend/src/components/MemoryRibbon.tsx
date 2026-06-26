// Signature de Vigía: la "cinta de memoria". Cada año 2003–2020 es un tick;
// los años con emergencia se encienden. "Tu distrito se inundó N veces" hecho objeto.
const START = 2003
const END = 2020

export function MemoryRibbon({ anios }: { anios: number[] }) {
  const hit = new Set(anios)
  const years = Array.from({ length: END - START + 1 }, (_, i) => START + i)

  return (
    <div>
      <div className="flex items-end gap-[3px]" role="img" aria-label={`Años con emergencias: ${anios.join(', ')}`}>
        {years.map((y) => {
          const on = hit.has(y)
          return (
            <div
              key={y}
              title={`${y}${on ? ' · emergencia' : ''}`}
              className={`flex-1 rounded-[2px] transition-colors ${on ? 'bg-oxblood' : 'bg-muted'}`}
              style={{ height: on ? '1.6rem' : '0.5rem' }}
            />
          )
        })}
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>{START}</span>
        <span>{END}</span>
      </div>
    </div>
  )
}
