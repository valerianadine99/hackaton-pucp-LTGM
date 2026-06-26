# Diccionario de datos — `data/`

> Para qué sirve **cada archivo** de `data/` y **qué se puede extraer** de él. Pensado como
> insumo del siguiente PR: **modelado de la BD + ingesta (ETL)**.
> Mapeo a modelos ORM al final.
>
> Todas las descargas oficiales fueron **verificadas en vivo el 2026-06-26** (HTTP 200).
> El portal `*.gob.pe` está tras un WAF que responde 418 a bots: descargar con `User-Agent`
> de navegador (+ `Referer: https://www.datosabiertos.gob.pe/` para datosabiertos).

---

## `raw/` — descargas oficiales crudas

### `BD-EMER-Y-DAÑOS-INTEGRADA-2003-2020-validada.xlsx`  ·  fuente PRINCIPAL (memoria)
- **Qué es:** Base de Emergencias y Daños de INDECI, integrada y validada, **2003–2020**.
  Origen: `https://portal.indeci.gob.pe/wp-content/uploads/2021/10/BD-EMER-Y-DAÑOS-INTEGRADA-2003-2020-validada.xlsx`
- **Forma:** 1 hoja `BD 2003-2020`, **96.528 filas** de datos, **49 columnas**. El encabezado real
  está en la **fila 3** (`pandas.read_excel(..., header=2)`).
- **Periodicidad:** snapshot estático (publicado 2021, no se actualiza). Cubre el **Niño Costero 2017**.
- **Qué se extrae (columnas clave):**

  | Concepto | Columna | Notas |
  |---|---|---|
  | ubigeo | `COD. DISTRITO` | 6 dígitos con ceros (`200101`); compatible con `IDDIST` del GeoJSON |
  | fenómeno | `EMERGENCIA` | vocabulario controlado (ver abajo) |
  | año / mes | `AÑO` / `MES` | 2003–2020 |
  | ubicación | `DPTO.` · `PROV.` · `DIST.` | nombres en MAYÚSCULAS |
  | daños | `FALLECIDOS`, `DAMNIFICADOS`, `AFECTADOS`, `VIVIENDAS DESTRUIDAS`, `VIVIENDAS AFECTADAS` (+ ~30 más) | enteros por evento |

- **Strings reales de `EMERGENCIA` (lluvia/Niño)** — verificados en el archivo, **distintos** a los del visor SINPAD2:
  `LLUVIA INTENSA` (25.262 nac.) · `INUNDACIÓN` (5.786) · `HUAYCO` (2.276) · `DESLIZAMIENTO` (3.662).
  → **Filtrar por "contiene"** sin tildes: `LLUVIA | INUNDAC | HUAYCO | DESLIZ`.

### `sinpad_mapas_emergencias/emergencias_YYYY.zip` (2017–2023)  ·  fuente COMPLEMENTARIA (geometría + recencia)
- **Qué es:** "Mapa de Emergencias" anual de INDECI, **un shapefile por año**. Origen: datasets
  `https://www.datosabiertos.gob.pe/dataset/mapa-de-emergencias-<AÑO>` → archivo en
  `sites/default/files/` (nombre varía: `Emergencias_YYYY.zip` o `E_YYYY.zip`).
- **Forma:** Shapefile ESRI completo (`.shp/.dbf/.prj/.shx/.cpg`), **CRS WGS84**, **codepage UTF-8**.
- **Periodicidad:** anual (2024/2025 aún no publicados a jun-2026).
- **Qué aporta que el xlsx NO tiene:**
  1. **Geometría puntual** del evento: campos `NUM_POSX` / `NUM_POSY` (coordenadas).
  2. **Años 2021, 2022, 2023** (el xlsx corta en 2020).
  3. **Strings de `FENOMENO` más finos:** `LLUVIAS INTENSAS`, `INUNDACIÓN POR DESBORDE DE RIO`,
     `INUNDACIÓN POR DESBORDE DE CANALES`, `HUAYCOS`, `EROSION FLUVIAL`, `TEMPORALES (VIENTOS CON LLUVIAS)`.
- **Qué se extrae:** `IDE_SINPAD`, `Fecha`, `ANHO`, `COD_UBIGEO`, `Departamen/Provincia/Distrito`,
  `FENOMENO` y ~60 campos de daños (`SDAMNI`, `SAFECTA`, `SFALLE`, `SDESTRUVIV`…).
- ⚠️ Disclaimer INDECI: las coordenadas son de la **jurisdicción que registra**, no del punto exacto.
  Para Vigía agrupamos por ubigeo, así que no afecta.
- **Costa norte, lluvia (2017–2023):** ≈2.795 registros en ≈199 distritos. Cross-valida el xlsx
  en años solapados (2019: xlsx 733 / shp 747; 2020: 335 / 352).

### `enfen/comunicado-enfen-11-2026.pdf` + `.txt`  ·  fuente de ANTICIPACIÓN (presente)
- **Qué es:** Comunicado Oficial ENFEN **N° 11-2026** (15-jun-2026). Origen:
  `https://enfen.imarpe.gob.pe/comunicados/` (descarga directa `?wpdmdl=2060`).
- **Periodicidad:** ~quincenal en periodo activo; numeración reinicia cada año; **sin API** (solo HTML+PDF).
- **Qué se extrae:**
  1. **Estado del sistema de alerta** (campo discreto): `No Activo` · `Vigilancia de El Niño Costero`
     · **`Alerta de El Niño Costero`** ← valor actual.
  2. **Texto crudo** (`.txt`, ya extraído del PDF) → es lo que el ETL **manda a Claude** para
     resumir a 2–3 frases (la respuesta se cachea en la BD, no se hardcodea).

---

## `geo/` — geometría distrital

### `peru_distrital_simple.geojson`  ·  geometría RÁPIDA (recomendada para la demo)
- **Qué es:** GeoJSON distrital nacional (repo `juaneladio/peru-geojson`), **límites INEI 2007**.
- **Qué se extrae (propiedades por feature):** `IDDIST` = ubigeo · `NOMBDIST` = nombre ·
  `NOMBPROV` · `NOMBDEP`. Listo para Leaflet sin conversión.
- ⚠️ **Pre-2013:** faltan *Veintiséis de Octubre* y *La Unión* (Piura). Suficiente para ~10–15
  distritos de la demo; declararlo en nota.

### `limites_ign_2023/DISTRITOS_LIMITES.zip`  ·  geometría OFICIAL (para reconciliar)
- **Qué es:** Shapefile oficial de límites distritales del **IGN** (~18 MB, escala 1:100.000).
  Origen: `https://www.datosabiertos.gob.pe/sites/default/files/DISTRITOS_LIMITES.zip`.
- **Qué se extrae:** polígonos distritales más actuales → sirve para **reconciliar los ubigeos
  post-2013** que faltan en el GeoJSON 2007. Requiere convertir SHP → GeoJSON (mapshaper/ogr2ogr).
- **Cuándo usarlo:** solo si se necesita cubrir Veintiséis de Octubre / La Unión; si no, el GeoJSON
  simple basta para la demo.

---

## `processed/` — insumos limpios para el ETL (generados por `scripts/`)

> El ETL **lee estos** y los carga a la BD. La app **no** los sirve como archivos.

### `districts.json`  ·  el contrato de datos
- **Qué es:** lista de distritos de costa norte con su memoria agregada. **207 distritos**.
- **Schema:** `[{ ubigeo, nombre, departamento, conteo, nivel, anios[] }]`
  - `conteo` = nº de emergencias de lluvia 2003–2020 · `nivel` = `alto|medio|bajo` por terciles
    (`bajo<9 ≤ medio<19 ≤ alto`) · `anios` = años con registro.
- → modelo `District`.

### `sinpad_costa_norte.csv`  ·  detalle por evento (con daños)
- **Qué es:** las **3.814 filas** filtradas (lluvia + 4 deptos, incluye DESLIZAMIENTO).
- **Qué se extrae:** detalle evento a evento + columnas de daños (`DAMNIFICADOS`, `AFECTADOS`,
  `VIVIENDAS DESTRUIDAS`, `FALLECIDOS`) → para los **contadores de impacto** y tooltips.

### `northcoast.geojson`  ·  geometría recortada
- **Qué es:** los polígonos del GeoJSON simple recortados a los 4 departamentos (**198 features**).
- → `District.geom` (JSONField).

### `checklists.json`  ·  acción
- **Qué es:** checklist curado de INDECI **por nivel** (`alto`/`medio`/`bajo`/`sin_registro`).
- → modelo `ChecklistItem`. **Curado, no generado por IA.**

---

## `scripts/` — reproducibilidad
- `build_districts.py` — xlsx → `districts.json` + `sinpad_costa_norte.csv` (filtro + groupby + niveles).
- `filter_geojson.py` — GeoJSON nacional → `northcoast.geojson` (recorte a 4 deptos).
- `requirements.txt` — deps (`pandas`, `openpyxl`).

```bash
cd data/scripts && pip install -r requirements.txt
python build_districts.py     # -> processed/districts.json + sinpad_costa_norte.csv
python filter_geojson.py      # -> processed/northcoast.geojson
```

---

## Mapeo para el siguiente PR (modelado de BD + ingesta)

| Archivo fuente | Modelo ORM sugerido | Campos |
|---|---|---|
| `processed/districts.json` | `District` | `ubigeo` (PK), `nombre`, `departamento`, `conteo`, `nivel`, `anios` (JSON/array) |
| `processed/northcoast.geojson` | `District.geom` | GeoJSON en `JSONField` (sin PostGIS) |
| `processed/sinpad_costa_norte.csv` | `Emergency` (opcional) | detalle por evento + daños, FK a `District` |
| `processed/checklists.json` | `ChecklistItem` | `nivel`, `orden`, `texto` |
| `raw/enfen/comunicado-enfen-11-2026.txt` | `EnfenSummary` | `estado` (discreto), `texto_crudo`, `resumen` (cacheado de Claude), `fecha` |

**Decisión pendiente para la ingesta:** ¿`District.conteo`/`anios` salen solo del **xlsx 2003-2020**
(memoria estable), o se **enriquecen con los shapefiles 2021-2023** (recencia)? El xlsx es la fuente
canónica; los shapefiles son complemento opcional. Documentado aquí para que la ingesta lo resuelva.
