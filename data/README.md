# data/ — Fuentes y pipeline de datos de Vigía

> Espacio de trabajo del rol **Datos**. Aquí viven las **fuentes confirmadas**, las descargas crudas y los **insumos del ETL**.
> Arquitectura canónica ([`CONTEXT.md`](../CONTEXT.md) · [`docs/architecture.md`](../docs/architecture.md)): un **ETL** (management command de Django) **puebla PostgreSQL (AWS RDS)** con esta data; la API DRF la sirve **desde la BD**. **Sin llamadas a fuentes externas (SINPAD/ENFEN) en vivo durante la demo.**

## Estructura

| Carpeta | Qué va aquí |
|---|---|
| `raw/` | Descargas oficiales **crudas**: el `.xlsx` de INDECI, los **shapefiles anuales 2017–2023** (`sinpad_mapas_emergencias/`) y el **comunicado ENFEN** (`enfen/`). |
| `geo/` | GeoJSON distrital (fuente + recorte a costa norte) y el **shapefile oficial IGN 2023** (`limites_ign_2023/`). |
| `processed/` | **Insumos limpios para el ETL** (conteos por distrito, GeoJSON recortado, CSV de detalle, checklists). El ETL los lee y los carga a la BD — **no** los sirve la app como archivos. |
| `scripts/` | Scripts reproducibles (`build_districts.py`, `filter_geojson.py`) + `requirements.txt`. |

> 📖 **[`DATA_DICTIONARY.md`](DATA_DICTIONARY.md)** — qué es **cada archivo** y **qué se extrae** de él,
> con el mapeo a modelos ORM para el siguiente PR (modelado de BD + ingesta).

> La geometría se guarda como GeoJSON en un `JSONField` de PostgreSQL (sin PostGIS). El resumen de ENFEN **no** es un archivo precomputado: el backend hace una **llamada real a Claude** y **cachea** la respuesta en la BD (ver §IA abajo).

---

## Fuentes confirmadas

### 1. Memoria histórica — SINPAD / INDECI (fuente PRINCIPAL) ✅

**Base de Datos de Emergencia y Daños 2003–2020 (integrada y validada), formato `.xlsx`:**

```
https://portal.indeci.gob.pe/wp-content/uploads/2021/10/BD-EMER-Y-DAÑOS-INTEGRADA-2003-2020-validada.xlsx
```

- Un solo archivo, cubre **2003–2020** (incluye el **Niño Costero 2017**, ancla emocional del jurado).
- Cargar con `pandas.read_excel(...)`. → guarda el archivo en `raw/`.
- Termina en 2020: **suficiente** para la capa de *memoria* (el "presente" lo da ENFEN).

**Complemento — Mapa de Emergencias anual (shapefiles 2017–2023)** en `raw/sinpad_mapas_emergencias/`:
- Datasets `https://www.datosabiertos.gob.pe/dataset/mapa-de-emergencias-<AÑO>` (2017→2023; 2024/25 aún no).
- Aportan lo que el xlsx **no** tiene: **geometría puntual** (NUM_POSX/Y), **años 2021–2023**, y strings
  `FENOMENO` más finos. Cross-validan el xlsx en años solapados (ver `DATA_DICTIONARY.md`).
- ⚠️ El nombre de archivo varía (`Emergencias_YYYY.zip` vs `E_YYYY.zip`): scrapear el href de cada
  página del año, no adivinar la ruta.

**Respaldo / verificación — Visor público SINPAD2** (no tiene export masivo, solo PDF por fila):

```
https://sinpad2.indeci.gob.pe/sinpad2/faces/public/listSinpadEnviadosPubli.xhtml
```

### 2. Geometría — GeoJSON distrital

**Opción rápida (recomendada, ya en GeoJSON, listo para Leaflet):**

```
https://raw.githubusercontent.com/juaneladio/peru-geojson/master/peru_distrital_simple.geojson
```

- Propiedades por feature: **`IDDIST` = ubigeo**, **`NOMBDIST` = nombre**, `NOMBPROV`, `NOMBDEP`.
- ⚠️ Data **INEI 2007 (límites pre-2013)** — faltan *Veintiséis de Octubre* / *La Unión* (Piura). Para ~10–15 distritos de la demo basta; **declararlo en una nota**.

**Límites actualizados 2023 (oficial) — YA descargado en `geo/limites_ign_2023/DISTRITOS_LIMITES.zip`:**
- Shapefile del IGN (~18 MB, 1:100.000). Convertir SHP → GeoJSON (mapshaper/ogr2ogr) si se necesita
  reconciliar los ubigeos post-2013 (Veintiséis de Octubre / La Unión).
- Visores de referencia: Demarca Perú / SDOT https://geosdot.servicios.gob.pe/visor/ ·
  GEO GPS PERÚ https://www.geogpsperu.com/2020/04/limite-distrital-politico-shapefile_28.html

### 3. Anticipación — ENFEN (comunicado → resumido por Claude)

- Comunicados: https://enfen.imarpe.gob.pe/comunicados/
- Último (N° 11-2026, **Alerta de El Niño Costero ACTIVA**): https://www.gob.pe/institucion/imarpe/noticias/1406677-comunicado-oficial-enfen-n-11-2026-estado-del-sistema-de-alerta-alerta-de-el-nino-costero
- **YA descargado** en `raw/enfen/`: `comunicado-enfen-11-2026.pdf` + `.txt` (texto extraído).
- Estado actual: El Niño Costero inició **marzo 2026**; probabilidad de **magnitud fuerte en verano 2027**.
- El ETL pasa el **texto crudo** (`.txt`) a **Claude**, que lo resume a 2-3 frases; la respuesta se **cachea en la BD**.

---

## Columnas del Excel y filtro (CONFIRMADO con el archivo real)

El header real está en la **fila 3** (`header=2` en pandas; arriba hay una fila vacía + un título). Columnas clave:

| Concepto | Columna en el Excel |
|---|---|
| ubigeo | `COD. DISTRITO` (6 dígitos con ceros, ej. `200101`) — compatible con `IDDIST` del GeoJSON |
| fenómeno | `EMERGENCIA` |
| año | `AÑO` (2003–2020) |
| departamento | `DPTO.` |
| distrito | `DIST.` |

**Valores reales de `EMERGENCIA` para lluvia/Niño** (resuelve el **riesgo #2** — los del visor/brief eran distintos):
- `LLUVIA INTENSA` (25.262 a nivel nacional)
- `INUNDACIÓN` (5.786)
- `HUAYCO` (2.276)

- `DESLIZAMIENTO` (3.662) — **incluido** desde este PR: CONTEXT.md lista "Huayco / Movimiento en masa",
  y los deslizamientos son movimiento en masa gatillado por lluvia.

Filtro (case-insensitive, sin tildes): conservar filas cuyo `EMERGENCIA` **contenga** `LLUVIA | INUNDAC | HUAYCO | DESLIZ`.
*(Se siguen excluyendo `EROSIÓN`, `DERRUMBE DE CERRO`, etc.; ampliar el criterio si se quiere.)*

## Cobertura: costa norte

Filtrar `DEPARTAMENTO ∈ { TUMBES, PIURA, LAMBAYEQUE, LA LIBERTAD }`.

---

## Pipeline (fuentes → insumos → ETL → BD)

```
raw/BD-EMER-Y-DAÑOS-...-2003-2020.xlsx
  └─ filtrar fenómeno (contiene LLUVIA|INUNDAC|HUAYCO|DESLIZ)
     └─ filtrar costa norte (4 deptos)
        └─ groupby(ubigeo / distrito) → conteo  +  años[]
           └─ asignar nivel (alto/medio/bajo, o "sin_registro" si N=0)
              └─ processed/districts.json

geo/peru_distrital_simple.geojson
  └─ filtrar a los 4 deptos → processed/northcoast.geojson

raw/enfen_comunicado.txt  (texto crudo del comunicado)

        ▼  ETL (Django management command)
  carga districts + geometría (JSONField) + checklists a PostgreSQL (AWS RDS);
  llama a Claude para resumir ENFEN y cachea el resultado en la BD
        ▼
  API DRF sirve todo desde la BD  →  frontend
```

**Insumos que entrega Datos al ETL** (modelos ORM en [`../docs/architecture.md`](../docs/architecture.md) §4):
- `processed/districts.json` → `[{ ubigeo, nombre, conteo, nivel, anios[] }]` (modelo `District`)
- `processed/northcoast.geojson` → geometría por ubigeo (a `District.geom` JSONField)
- `processed/checklists.json` → checklist INDECI por nivel (curado, no IA) (modelo `ChecklistItem`)
- `raw/enfen_comunicado.txt` → texto crudo que el ETL manda a Claude (resumen cacheado en `EnfenSummary`)

## Estado del procesamiento (HECHO ✅)

Ejecutado sobre el Excel real con los scripts de `scripts/`:

- **3.814** emergencias de lluvia en costa norte (2003-2020, **ya con DESLIZAMIENTO**) → **207 distritos** con registro.
- `processed/districts.json` (207) · `processed/sinpad_costa_norte.csv` (3.814 filas)
- `processed/northcoast.geojson` (198 polígonos) → **197 coloreados + 1 gris**.
- Niveles por **terciles** del conteo: `bajo < 9 ≤ medio < 19 ≤ alto`. Top: Tumbes (159), Ayabaca (102), Tambo Grande (100).
- `processed/checklists.json`: checklist INDECI curado por nivel (alto/medio/bajo/sin_registro).

**Desajustes de ubigeo (10 distritos de la data sin polígono):**
- `200115 Veintiséis de Octubre` (Piura, 11 emergencias) — distrito **post-2013** ausente del GeoJSON 2007 (**riesgo #3**). Opción: fusionar al distrito padre (Piura `200101`) o declararlo en una nota del mapa.
- 9 más con códigos ubigeo **legacy/erróneos** en SINPAD (ej. *Castilla, Piura* como `1902xx` en vez de `2001xx`), conteos ≤ 8 → bajo impacto en la demo.

### Regenerar
```bash
cd data/scripts && pip install -r requirements.txt
python build_districts.py     # -> processed/districts.json + sinpad_costa_norte.csv
# descargar la fuente nacional una vez (ver geo/.gitkeep), luego:
python filter_geojson.py       # -> processed/northcoast.geojson
```

## Checklist para Luis (rol Datos)

- [x] Descargar el `.xlsx` 2003-2020 → `raw/`
- [x] Confirmar columnas: `COD. DISTRITO` (ubigeo) · `EMERGENCIA` (fenómeno) · `AÑO` · `DPTO.` · `DIST.`
- [x] Filtrar fenómeno + costa norte → agrupar por distrito → conteo + años (`build_districts.py`)
- [x] Descargar el GeoJSON distrital → recortar a 4 deptos → `processed/northcoast.geojson` (`filter_geojson.py`)
- [ ] **Pendiente:** reconciliar los 10 ubigeos sin polígono (Veintiséis de Octubre + códigos legacy)
- [x] Exportar `processed/districts.json` → listo para que el ETL lo cargue a la BD

## Plan-B (si el Excel/match se rompe — timebox 90 min)

~15 distritos anclados al reporte COEN del Niño Costero 2017: **Piura 91.835 damnificados; Catacaos ≈ 45 mil** (entre los más afectados con Cura Mori). Sigue siendo **dato real** cargado en la misma BD. Densidad sobre cobertura: el clímax necesita ~10–15 distritos convincentes, no los 1.870.
