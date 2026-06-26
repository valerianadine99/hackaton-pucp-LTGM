# Vigía — Fuentes de datos del Estado peruano (verificadas)

> Reporte de deep research **verificado en vivo el 2026-06-26**. Cada URL fue
> probada con `curl` + User-Agent de navegador. Lo marcado ✅ DESCARGA HOY se
> confirmó con HTTP 200 + content-type + magic bytes correctos. Lo marcado
> ⚠️ ROTO está listado en el portal pero devuelve 404.
>
> Cubre los tres pilares de `CONTEXT.md`: **SINPAD** (memoria), **ENFEN**
> (anticipación), **límites distritales** (geometría).

## TL;DR para el equipo (3h)

- **La fuente SINPAD que realmente baja y sirve para el clímax es el shapefile
  "Mapa de Emergencias" por año** (`E_2023.zip`, `E_2018.zip`), **no** los Excel
  anuales — esos están listados pero **rotos (404)**.
- `E_2023.zip` trae **2.276 emergencias nacionales, 134 en la costa norte**
  (Piura 66, Tumbes 32, La Libertad 21, Lambayeque 15) con `COD_UBIGEO`,
  `FENOMENO`, `Fecha`, `ANHO` y ~60 campos de daños. Suficiente para colorear el
  mapa con un solo año.
- **ENFEN**: comunicados PDF, cadencia ~quincenal, estado de alerta = campo
  discreto. Al 2026-06-26 el último es **N°11-2026 (15-jun-2026) = "Alerta de El
  Niño Costero"**.
- **Límites distritales**: shapefile IGN (`DISTRITOS_LIMITES.zip`, 18 MB) baja
  hoy; capa INEI Versión 2023 vía visor SDOT. Ambas **referenciales** → reconciliar
  ubigeos post-2013 de Piura.
- **Todo el portal `*.gob.pe` está tras WAF Huawei (HTTP 418 a bots).** El ETL
  DEBE mandar `User-Agent` de navegador (+ `Referer` en datosabiertos). El apex
  `datosabiertos.gob.pe` no resuelve: usar `www.`

---

## 1) SINPAD / INDECI — emergencias históricas (MEMORIA)

### 1a. Mapa de Emergencias por año (shapefile) — ✅ LA FUENTE A USAR

- **Página:** https://www.datosabiertos.gob.pe/dataset/mapa-de-emergencias-2023
- **Descarga directa (verificada HTTP 200, `application/zip`):**
  - `https://www.datosabiertos.gob.pe/sites/default/files/E_2023.zip` — 184 KB ✅
  - `https://www.datosabiertos.gob.pe/sites/default/files/E_2018.zip` — 358 KB ✅
  - `E_2019..E_2022`, `E_2024`, `E_2025` → **404 (no existen)** ⚠️
- **Naturaleza:** Shapefile ESRI completo (`.shp/.dbf/.prj/.shx/.cpg`…), **CRS WGS84**,
  **codepage UTF-8** (declarado en `.CPG`).
- **Granularidad:** distrito vía `COD_UBIGEO` (C6). 2.276 registros / 74 campos en 2023.
- **Campos clave:** `IDE_SINPAD`, `Fecha`(D), `ANHO`, `Mes`, `COD_UBIGEO`,
  `Departamen`, `Provincia`, `Distrito`, `FENOMENO`(C254), `SAFECTA`/`SDAMNI`/`SFALLE`/
  `SDESTRUVIV`… (~60 campos de daños), `NUM_POSX`/`NUM_POSY`.
- **Strings EXACTOS de `FENOMENO` (verificados en `E_2023.dbf`)** — filtro lluvia para Vigía:
  - `LLUVIAS INTENSAS` (923)
  - `DESLIZAMIENTO` (150)
  - `TEMPORALES (VIENTOS CON LLUVIAS)` (103)
  - `INUNDACIÓN POR DESBORDE DE RIO` (97) ← con tilde, UTF-8
  - `HUAYCOS` (63)
  - `INUNDACIÓN POR DESBORDE DE CANALES` (20)
  - `EROSION FLUVIAL` (9)
  - (otros no-lluvia: `INCENDIOS URBANOS`, `GRANIZADAS`, `VIENTOS FUERTES`, `NEVADAS`, `SISMOS`…)
- **Cómo extraer:** descarga directa del ZIP → leer `.dbf` (UTF-8) → filtrar `FENOMENO`
  en la lista de arriba → agrupar por `COD_UBIGEO`. **No requiere scraping.**
- **Periodicidad:** anual, pero la serie publicada **tiene huecos** (solo 2018 y 2023
  confirmados). No es serie continua 2003→hoy.

### 1b. Excel anuales 2003–2018 — ⚠️ LISTADOS PERO ROTOS

- **Página:** https://www.datosabiertos.gob.pe/dataset/emergencias-historicas-registradas-por-indeci
  (MINDEF/INDECI · licencia Open Data Commons Attribution · "frecuencia Anual" ·
  descripción: *"emergencias de todos los fenómenos desde el año 2003 hasta la actualidad"*).
- La página **enlaza** `Emergencias2003.xls … Emergencias2018.xls`, pero cada
  `https://www.datosabiertos.gob.pe/sites/default/files/EmergenciasYYYY.xls`
  devuelve **404 (HTML de error)**. ⚠️ **No usar como fuente de descarga.**
- **Excepción que SÍ baja:** `Emergencias_2007.zip` (287 KB, ZIP válido) ✅
- **Disclaimer oficial de granularidad** (citarlo en la app): *"la localización de las
  emergencias no corresponden al lugar de los hechos, sin embargo se encuentra dentro de
  la jurisdicción que registra la emergencia."* → las coordenadas son de la jurisdicción,
  no del punto exacto. Para Vigía da igual: agrupamos por ubigeo, no por punto.

### 1c. Otros puntos SINPAD

- Grupo INDECI en el portal: https://www.datosabiertos.gob.pe/group/instituto-nacional-de-defensa-civil-indeci
- Dataset alterno "registradas con SINPAD": existe pero su página redirige/no expone
  recursos limpios — usar 1a.
- `sinpad.indeci.gob.pe` (sistema transaccional en vivo): **no es fuente de datos abiertos
  estable**, no usar para el ETL.

---

## 2) ENFEN — estado de alerta y comunicados (ANTICIPACIÓN)

- **Listado oficial (WordPress + WPDM):** https://enfen.imarpe.gob.pe/comunicados/
  (HTTP 200 ✅; filtro por año 2016–2026).
- **Espejo en Plataforma del Estado (gob.pe / SENAMHI):**
  https://www.gob.pe/institucion/senamhi/colecciones/1308-comunicados-enfen
  — **98 resultados** verificados hoy. Apto para scraping del listado (más estable que el WP).
- **Descarga directa de un PDF** (patrón WPDM): `https://enfen.imarpe.gob.pe/?wpdmdl=<ID>`
  — verificado: `?wpdmdl=1974` → HTTP 200 `application/pdf` (651 KB) = Comunicado N°13-2025. ✅
  - ⚠️ Las URLs con token `&ind=...` son anti-hotlink y **expiran**: usar solo `wpdmdl=<ID>`.
- **Naturaleza:** PDF de 3–4 páginas. El dato que importa es el **estado del sistema de
  alerta**, campo **discreto enumerado** para la región Niño 1+2:
  `No Activo` · `Vigilancia de El Niño Costero` · `Alerta de El Niño Costero`
  (definido en la Nota Técnica ENFEN 02-2024).
- **Estado vigente al 2026-06-26:** **`Alerta de El Niño Costero`** (Comunicado N°11-2026,
  15-jun-2026; se proyecta hasta verano 2027).
- **Periodicidad:** ~**quincenal** (normalmente viernes) en periodo activo; baja a mensual
  en calma; existen **comunicados extraordinarios**. La numeración **reinicia cada año**.
  Cada comunicado anuncia la fecha del siguiente, pero **no hay calendario fijo garantizado**.
- **Cómo extraer:**
  - Estado actual: scrapear `/comunicados/` (o el espejo gob.pe) → tomar el último →
    parsear el PDF para el string de estado. **No hay API/JSON/RSS estructurado** (pregunta abierta).
  - Para Vigía (1 sola llamada de IA): **descargar el PDF del último comunicado y resumirlo**.
    Coherente con el constitution (IA = llamada real al modelo sobre texto real).
  - ⚠️ El estado **cambia cada quincena** → en producción no cachear el estado a largo plazo
    (sí se puede cachear el resumen de IA del comunicado concreto).

---

## 3) Límites distritales por UBIGEO (GEOMETRÍA)

### 3a. Shapefile IGN — ✅ DESCARGA HOY

- **Página:** https://www.datosabiertos.gob.pe/dataset/limites-departamentales (autor IGN).
- **Descarga directa (verificada HEAD HTTP 200, `application/zip`, 18.752.137 bytes,
  Last-Modified 2025-06-24):**
  `https://www.datosabiertos.gob.pe/sites/default/files/DISTRITOS_LIMITES.zip` ✅
- **Naturaleza:** límites distritales, escala **1:100.000**, **referenciales** (sin vintage/año
  declarado). Formato SHP.
- **Cómo extraer:** descarga directa → `ogr2ogr`/GeoPandas a GeoJSON → filtrar costa norte por
  prefijo de ubigeo (Tumbes 24, Piura 20, Lambayeque 14, La Libertad 13) → simplificar geometría
  para el mapa móvil.

### 3b. Capa INEI Versión 2023 (visor SDOT / Demarca Perú) — recomendada para reconciliar ubigeo

- **Visor:** https://geosdot.servicios.gob.pe/visor/ (HTTP 200 ✅). Capa **"Límite distrital"**
  → *"Límites censales distritales elaborados por el INEI. Versión 2023"*. Es la **cosecha vigente**
  a jun-2026. También departamental y provincial.
- **Naturaleza:** límites censales **"de carácter referencial no demarcatorio"**.
- **Uso:** validar/asignar los **ubigeos correctos** (2023) sobre la geometría, sobre todo
  los **distritos de Piura creados post-2013**: **Veintiséis de Octubre** (creado 2013, Ley 29991)
  y **La Unión**. El shapefile IGN 1:100.000 puede no traerlos separados → reconciliar contra
  el catálogo UBIGEO INEI 2023.

### 3c. Respaldo open-source (plan B de geometría)

- `https://github.com/juaneladio/peru-geojson` — GeoJSON distrital del Perú (secundario, útil
  si el IGN da problemas en la demo).
- `https://github.com/josedaniel-cb/limites-peru-geojson` — alternativa.
- ⚠️ Verificar que incluyan los ubigeos post-2013 de Piura antes de confiar.

---

## Caveats operativos (leer antes del ETL)

1. **WAF Huawei en `*.gob.pe`** → manda `User-Agent` de navegador siempre; `Referer:
   https://www.datosabiertos.gob.pe/` para archivos en `sites/default/files/`. `curl` crudo o
   `WebFetch` por defecto → HTTP 418. El apex `datosabiertos.gob.pe` sin `www` no tiene registro A.
2. **SINPAD multi-año es frágil**: solo `E_2018.zip` y `E_2023.zip` bajan; los XLS están rotos.
   Para el clímax basta `E_2023` (134 registros costa norte). Si se quiere histórico real
   2003→hoy hay que evaluar el sistema SINPAD transaccional o solicitar el consolidado — **fuera
   del timebox de 3h**. → Esto **valida el plan-B** del `CONTEXT.md` (anclar ~15 distritos).
3. **Encoding**: los DBF vienen en **UTF-8** (no latin1). `INUNDACIÓN` lleva tilde.
4. **Límites referenciales, no demarcatorios** (IGN e INEI). No usar para disputas de frontera;
   para colorear un choropleth es perfecto.
5. **ENFEN sin API**: solo HTML + PDF. El estado cambia cada quincena.

## Preguntas abiertas

- ¿Existe un consolidado SINPAD 2003→hoy descargable (no los XLS rotos, no shapefiles sueltos)?
- ¿El UBIGEO INEI 2023 ya trae Veintiséis de Octubre / La Unión con código correcto?
- ¿ENFEN/IMARPE expone algún feed estructurado del estado de alerta? (hoy: no encontrado).
- ¿Los strings de `FENOMENO` son idénticos entre años? (2023 verificado; otros años por confirmar).

---

*Fuentes primarias (.gob.pe) verificadas en vivo 2026-06-26. Deep research:
21 fuentes consultadas, 85 claims extraídos, 25 verificados adversarialmente,
2 refutados por unanimidad. Verificación de descargas re-confirmada manualmente con curl.*
