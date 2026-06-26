# data/ — Fuentes y pipeline de datos de Vigía

> Espacio de trabajo del rol **Datos**. Aquí viven las **fuentes confirmadas**, las descargas crudas y los **insumos del ETL**.
> Arquitectura canónica ([`CONTEXT.md`](../CONTEXT.md) · [`docs/architecture.md`](../docs/architecture.md)): un **ETL** (management command de Django) **puebla PostgreSQL (AWS RDS)** con esta data; la API DRF la sirve **desde la BD**. **Sin llamadas a fuentes externas (SINPAD/ENFEN) en vivo durante la demo.**

## Estructura

| Carpeta | Qué va aquí |
|---|---|
| `raw/` | Descargas oficiales **crudas** (el `.xlsx` de INDECI, el comunicado ENFEN). Re-descargables desde los links de abajo. |
| `geo/` | GeoJSON distrital: la fuente y el recorte a **costa norte**. |
| `processed/` | **Insumos limpios para el ETL** (conteos por distrito, GeoJSON recortado, texto ENFEN, checklists). El ETL los lee y los carga a la BD — **no** los sirve la app como archivos. |

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

**Límites actualizados 2023 (oficial, shapefile → convertir con mapshaper):**
- Demarca Perú / SDOT: https://geosdot.servicios.gob.pe/visor/
- GEO GPS PERÚ: https://www.geogpsperu.com/2020/04/limite-distrital-politico-shapefile_28.html

### 3. Anticipación — ENFEN (comunicado → resumido por Claude)

- Comunicados: https://enfen.imarpe.gob.pe/comunicados/
- Último (N° 11-2026, **Alerta de El Niño Costero ACTIVA**): https://www.gob.pe/institucion/imarpe/noticias/1406677-comunicado-oficial-enfen-n-11-2026-estado-del-sistema-de-alerta-alerta-de-el-nino-costero
- Estado actual: El Niño Costero inició **marzo 2026**; probabilidad de **magnitud fuerte en verano 2027**.
- → guardar el **texto crudo** del comunicado en `raw/` (o `processed/enfen_comunicado.txt`). El ETL se lo pasa a **Claude**, que lo resume a 2-3 frases, y la respuesta se **cachea en la BD**.

---

## Filtro de fenómeno (strings reales, verificados en el visor SINPAD2)

> Resuelve el **riesgo #2 de CONTEXT.md**. Los valores reales del campo "Peligro principal" **no** son los que asumía el brief. **Filtrar por "contiene", no por igualdad exacta.**

Valores observados:
- `LLUVIAS INTENSAS`
- `INUNDACIÓN POR DESBORDE DE RIO`
- `INUNDACIÓN POR DESBORDE DE CANALES`
- `HUAYCO` / `MOVIMIENTO EN MASA`

Regla de filtro (case-insensitive, sin tildes): conservar filas cuyo fenómeno **contenga**

```
INUNDAC  |  LLUVIA  |  HUAYCO  |  MOVIMIENTO EN MASA
```

> ⚠️ El nombre de la columna y la granularidad en el **Excel 2003-2020** pueden diferir del visor — verificar al abrir el archivo y ajustar el filtro a lo que aparezca.

## Cobertura: costa norte

Filtrar `DEPARTAMENTO ∈ { TUMBES, PIURA, LAMBAYEQUE, LA LIBERTAD }`.

---

## Pipeline (fuentes → insumos → ETL → BD)

```
raw/BD-EMER-Y-DAÑOS-...-2003-2020.xlsx
  └─ filtrar fenómeno (contiene INUNDAC|LLUVIA|HUAYCO|MOVIMIENTO EN MASA)
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

## Checklist para Luis (rol Datos)

- [ ] Descargar el `.xlsx` 2003-2020 → `raw/`
- [ ] Abrir y anotar: ¿hay columna `ubigeo`? nombre exacto de la columna de fenómeno y de distrito
- [ ] Filtrar fenómeno + costa norte → agrupar por distrito → conteo + años
- [ ] Descargar el GeoJSON distrital → recortar a 4 deptos → `processed/northcoast.geojson`
- [ ] Reconciliar ubigeos (o match por nombre normalizado si no hay ubigeo)
- [ ] Exportar `processed/districts.json` → entregar al ETL para cargar a la BD

## Plan-B (si el Excel/match se rompe — timebox 90 min)

~15 distritos anclados al reporte COEN del Niño Costero 2017: **Piura 91.835 damnificados; Catacaos ≈ 45 mil** (entre los más afectados con Cura Mori). Sigue siendo **dato real** cargado en la misma BD. Densidad sobre cobertura: el clímax necesita ~10–15 distritos convincentes, no los 1.870.
