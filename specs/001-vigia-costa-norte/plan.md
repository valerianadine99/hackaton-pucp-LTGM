# Implementation Plan: Vigía — Memoria y acción del Niño en costa norte

**Branch**: `001-vigia-costa-norte` | **Date**: 2026-06-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-vigia-costa-norte/spec.md`

## Summary

Una sola pantalla que cuenta la historia del Niño en costa norte con dos datos: **memoria**
(mapa choropleth por conteo de emergencias SINPAD) + **acción** (panel con nivel + checklist
INDECI + resumen ENFEN). Todo se sirve **en vivo desde PostgreSQL vía la API DRF** (integración
real, datos reales; nada fake). El enfoque técnico es: congelar un **contrato de datos JSON** desde
el minuto 0:30 para que los tres carriles (Datos, Frontend/Mapa, IA+Integración) avancen en paralelo
desacoplados — el front usa un dummy con ese shape **solo en dev** hasta que la BD real esté poblada.

## Technical Context

**Language/Version**: TypeScript 5 (Next.js 14, React 18) · Python 3.11+ (Django 5 + DRF)

**Primary Dependencies**: Frontend — Next.js App Router, React, **Leaflet**, **Turf.js**
(point-in-polygon de la geoloc en el cliente). Backend — Django REST Framework, **psycopg**
(PostgreSQL), **anthropic** (SDK de Claude para el resumen ENFEN).

**Storage**: **PostgreSQL en AWS RDS** (fuente única de verdad). Modelos ORM: `District`
(ubigeo, nombre, conteo, nivel, anios, **geom = GeoJSON en JSONField**), `Emergencia`,
`ChecklistItem`, `EnfenSummary` (resumen real de Claude, cacheado). Sin PostGIS. El ETL
(management command) puebla la BD; la API la sirve. El front no embebe data (Ppio. VIII).

**Testing**: `pytest` (backend) + `jest` (frontend). Hito 2 exige un test del happy path + 1 caso
de error de la funcionalidad crítica (el clímax: `/api/districts` y detalle).

**Target Platform**: Web **mobile-first** (la demo y el usuario real ocurren en celular — Ppio. VII).

**Project Type**: Web app — monorepo `frontend/` (Next.js) ↔ `backend/` (Django DRF + PostgreSQL).
Sin microservicios.

**Performance Goals**: Clímax (mapa → clic → panel) fluido en móvil. ~100–150 polígonos
renderizados sin lag; ~10–15 coloreados con dato real.

**Constraints**: **Integración real con datos reales** (NON-NEGOTIABLE, Ppio. II). ~3h de build.
Una sola pantalla. Espina de datos timeboxed a 90 min con plan-B (COEN). Deploy: Vercel (front) +
EC2/Elastic IP + RDS (back).

**Scale/Scope**: Costa norte (Tumbes, Piura, Lambayeque, La Libertad), ~100–150 distritos.
4 user stories (P1–P4). 3 endpoints DRF nuevos.

## Contrato de datos (congelado — Principio VI)

Única dependencia entre carriles. Se congela primero; nadie cambia su forma sin acuerdo.
Es el shape de la **respuesta de la API** (servida desde la BD), no de un archivo estático.

```jsonc
// GET /api/districts → [ DistrictSummary ]
{ "ubigeo": "200104", "nombre": "Catacaos", "conteo": 7, "nivel": "alto", "anios": [2017, 2023] }

// GET /api/districts/<ubigeo> → DistrictDetail
{
  "ubigeo": "200104", "nombre": "Catacaos", "conteo": 7, "nivel": "alto", "anios": [2017, 2023],
  "enfen_resumen": "…2–3 frases (Claude, cacheado)…",
  "checklist": ["item 1", "item 2", "…"]        // curado INDECI por nivel
}

// GET /api/enfen → EnfenState
{ "nivel_alerta": "…", "resumen": "…2–3 frases (llamada real a Claude)…", "fecha": "2026-06-…" }
```

`nivel ∈ {"sin_registro", "bajo", "medio", "alto"}`. `sin_registro` → gris (nunca verde).
**Dummy de 3 distritos** con este shape exacto desbloquea Frontend e IA desde el minuto 0 —
**solo en dev**; nunca llega a la demo.

## Constitution Check

*GATE: pasa antes de implementar.*

- ✅ **I. Agencia, no amenaza**: panel siempre termina en memoria + nivel + acción (FR-006/007); sin diagnóstico binario.
- ✅ **II. Integración real, datos reales**: BD PostgreSQL/RDS + llamada real a Claude (FR-008/009); nada hardcodeado ni fake.
- ✅ **III. Densidad sobre cobertura**: meta ~10–15 distritos reales (SC-001), plan-B con dato real anclado a COEN.
- ✅ **IV. Traducir, no pedir**: solo SINPAD/ENFEN/GeoJSON IGN-INEI ya públicos.
- ✅ **V. Registro ≠ predicción**: leyenda honesta (FR-005), gris explícito para sin-registro (FR-004).
- ✅ **VI. Contrato estable**: shape JSON congelado arriba; dummy de dev desbloquea carriles.
- ✅ **VII. Mobile-first**: target móvil, responsive desde el inicio.
- ✅ **VIII. Escalabilidad y mantenibilidad**: toda la info en la BD del backend; capas limpias (modelos · serializers · vistas); sin data en el front.

Sin violaciones. Complexity Tracking vacío.

## Project Structure

### Documentation (this feature)

```text
specs/001-vigia-costa-norte/
├── plan.md              # Este archivo
├── spec.md              # Spec con user stories P1–P4
└── tasks.md             # Salida de /speckit-tasks (siguiente paso)
```

### Source Code (repository root)

```text
backend/
├── api/
│   ├── models.py            # NUEVO: District, Emergencia, ChecklistItem, EnfenSummary (ORM)
│   ├── urls.py              # + /api/districts, /api/districts/<ubigeo>, /api/enfen
│   ├── views.py             # + vistas DRF que consultan la BD vía ORM
│   ├── serializers.py       # + DistrictSummary/Detail/Enfen
│   ├── services/enfen.py    # NUEVO: llamada real a Claude (anthropic SDK) + cache en BD
│   ├── management/commands/
│   │   └── etl.py           # NUEVO: puebla la BD (SINPAD CSV + GeoJSON + checklists INDECI)
│   └── migrations/          # NUEVO: esquema de los modelos
├── config/settings.py       # + DATABASE_URL (Postgres/RDS), ANTHROPIC_API_KEY, CORS, ALLOWED_HOSTS
└── tests/test_api.py        # + contrato de los nuevos endpoints (happy + error)

frontend/
└── src/
    ├── app/page.tsx          # pantalla única: mapa + panel (mobile-first)
    ├── components/
    │   ├── MemoryMap.tsx     # NUEVO: choropleth Leaflet (US1), pinta GeoJSON de la API
    │   ├── DistrictPanel.tsx # NUEVO: memoria + nivel + checklist (US2)
    │   ├── EnfenSummary.tsx  # NUEVO: resumen ENFEN (US3)
    │   └── GeoButton.tsx     # NUEVO: geoloc secundario, Turf.js point-in-polygon (US4)
    └── lib/api.ts            # + fetchers de los 3 endpoints (dummy en dev)
```

**Structure Decision**: Monorepo web existente. Toda la data (conteos, geometría GeoJSON,
checklists, resumen ENFEN) vive en **PostgreSQL** y se sirve por la API DRF. El front la consume;
no embebe data ni GeoJSON (Ppio. VIII). En dev, Frontend e IA corren contra un dummy en memoria con
el shape del contrato hasta que el ETL puebla la BD real; el dummy nunca llega a la demo.

## Reparto en 3 carriles (paralelo desde 0:30)

| Carril | User Stories | Entrega (artefacto consumible) |
|--------|--------------|-------------------------------|
| **A · Datos** | habilita US1/US2 | Modelos ORM + **ETL** que puebla RDS con conteos SINPAD por ubigeo + GeoJSON reconciliado (JSONField) + checklists INDECI. Plan-B ~15 distritos COEN (real) si la espina excede 90 min. |
| **B · Frontend/Mapa** | US1 + US2 + US4 | `MemoryMap` (choropleth + clic), `DistrictPanel` (memoria+nivel+checklist), `GeoButton` (Turf.js). Arranca contra dummy de 3 distritos. |
| **C · IA+Integración** | US3 | `services/enfen.py` con llamada real a Claude (cacheada en BD) + endpoints DRF cableados + deploy (Vercel/EC2/RDS) + pega todo. |

**Punto de sincronización único**: el contrato JSON (respuesta de la API). Carril B y C corren contra
el dummy desde el minuto 0; cuando Carril A puebla la BD real, la API sirve lo real sin tocar la UI.

## Complexity Tracking

Sin violaciones constitucionales que justificar.
