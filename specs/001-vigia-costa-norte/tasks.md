# Tasks: Vigía — Memoria y acción del Niño en costa norte

**Input**: `spec.md` + `plan.md` + `docs/architecture.md` (Hito 1) en `specs/001-vigia-costa-norte/`

**Estrategia**: **híbrida** (para 3h, 3 personas). Se detallan completas la **fundación** y el
**primer slice de cada historia** — suficiente para que las 3 personas trabajen ~60-90 min sin
bloquearse. La **cola** (deploy, tests, ADRs, pulido) se detalla en el checkpoint con
`/speckit-converge`, cuando P1-P3 aterricen. No se sobre-planifica la hora 3.

## Formato: `[ID] [P?] [Carril] [Story] Descripción`

- **[P]** = paralelizable (archivos distintos, sin dependencias)
- **Carriles**: **A** = Datos · **B** = Frontend/Mapa · **C** = IA+Integración/Infra
- **Story**: US1 (mapa, P1) · US2 (acción, P2) · US3 (ENFEN, P3) · US4 (geoloc, P4)

---

## Phase 1: Setup compartido (los 3 juntos, ~15-20 min)

**Objetivo**: dejar listo el terreno para que nadie se bloquee. Es el único tramo no paralelo.

- [ ] T001 [P] [A] Backend: añadir `psycopg[binary]`, `dj-database-url`, `anthropic` a `backend/requirements.txt`; configurar `DATABASE_URL` y `ANTHROPIC_API_KEY` en `backend/config/settings.py` (vía env, `DEBUG=False`-ready).
- [ ] T002 [P] [B] Frontend: `npm i leaflet react-leaflet @turf/boolean-point-in-polygon`; tipos; configurar `NEXT_PUBLIC_API_BASE_URL` en `frontend/.env.local`.
- [ ] T003 [P] [C] Provisionar infra: instancia **RDS PostgreSQL** + **EC2 con Elastic IP**; anotar `DATABASE_URL` y la IP en un canal compartido (no commitear secretos).
- [ ] T004 [A][B][C] **Congelar el contrato JSON** (Ppio. VI): acordar el shape de `/api/districts`, `/api/districts/<ubigeo>`, `/api/enfen` (ver `plan.md`). A partir de aquí no cambia sin acuerdo de los 3.

**Checkpoint**: terreno listo. Sigue la fundación (bloqueante).

---

## Phase 2: Foundational (bloquea TODAS las historias) ⚠️

**Objetivo**: lo mínimo para que B y C corran contra algo real con el shape del contrato.

- [ ] T005 [A] [US1] Modelos ORM en `backend/api/models.py`: `District` (ubigeo, nombre, departamento, conteo, nivel, anios=JSON, **geom=JSONField**), `Emergencia`, `ChecklistItem`, `EnfenSummary`. + `makemigrations` & `migrate` contra RDS.
- [ ] T006 [A] [US1] Seed **dummy de 3 distritos** (fixture/management command) con el shape exacto del contrato — desbloquea B y C **solo en dev** (nunca llega a la demo).
- [ ] T007 [C] [US1] Esqueleto de los 3 endpoints DRF en `backend/api/{urls,views,serializers}.py` devolviendo data de la BD (dummy por ahora). Reemplaza el mock `/api/items`.
- [ ] T008 [P] [B] [US1] `frontend/src/lib/api.ts`: fetchers + tipos TypeScript del contrato, apuntando a `NEXT_PUBLIC_API_BASE_URL` (consume el dummy).

**Checkpoint**: fundación lista → **las historias arrancan en paralelo** (A, B, C a la vez).

---

## Phase 3: User Story 1 — Mapa de memoria (P1) 🎯 MVP

**Meta**: mapa choropleth + clic → memoria del distrito. Es el clímax.
**Test independiente**: clic en Catacaos → panel muestra conteo y años correctos desde la BD.

- [ ] T009 [A] [US1] **ETL** (`backend/api/management/commands/etl.py`): descargar SINPAD CSV, filtrar fenómeno (`Inundación`, `Lluvias intensas`, `Huayco / Mov. en masa` — **verificar strings exactos**), agrupar por ubigeo → `conteo` + `anios[]`. Timebox 90 min; si falla → plan-B COEN (~15 distritos reales).
- [ ] T010 [A] [US1] ETL: cargar **GeoJSON costa norte** (IGN/INEI), reconciliar ubigeos (ojo pos-2013: Veintiséis de Octubre / La Unión) → `District.geom` (JSONField). Asignar `nivel` por umbrales (FR-013: 0=gris, 1-2 bajo, 3-5 medio, 6+ alto).
- [ ] T011 [B] [US1] `MemoryMap.tsx`: choropleth Leaflet pintando el GeoJSON servido por `/api/districts`; color por `nivel`; **gris** explícito para `sin_registro` (nunca verde). Mobile-first.
- [ ] T012 [B] [US1] Clic/tap en distrito → estado seleccionado → panel con `nombre`, `conteo`, `anios[]`. Dropdown de respaldo (FR-002).
- [ ] T013 [B] [US1] Leyenda honesta (conteo crudo, sin normalizar — FR-005) + disclaimer de pie (FR-011).

**Checkpoint**: US1 funcional con dato real. **MVP demostrable.**

---

## Phase 4: User Story 2 — Acción: nivel + checklist (P2)

**Meta**: panel cierra en memoria + nivel + acción. **Test**: cualquier distrito muestra checklist (incluso sin registro).

- [ ] T014 [A] [US2] Cargar **checklists INDECI** por nivel (3 niveles + base) → `ChecklistItem` en BD.
- [ ] T015 [C] [US2] `/api/districts/<ubigeo>`: histórico + estado ENFEN + checklist por nivel (yuxtapuestos, sin fórmula — FR-006).
- [ ] T016 [B] [US2] `DistrictPanel.tsx`: riesgo histórico **y** estado ENFEN lado a lado + checklist; garantizar checklist base si `sin_registro` (FR-007, nunca callejón sin salida).

**Checkpoint**: US1 + US2 funcionales.

---

## Phase 5: User Story 3 — Resumen ENFEN con Claude (P3)

**Meta**: resumen real de 2-3 frases. **Test**: `/api/enfen` devuelve resumen legible; 2ª llamada sale de cache.

- [ ] T017 [C] [US3] `backend/api/services/enfen.py`: **llamada real a Claude** (SDK `anthropic`) que resume el comunicado ENFEN a 2-3 frases; **cachear** la respuesta real en `EnfenSummary` (BD).
- [ ] T018 [C] [US3] `/api/enfen` sirve el resumen (cache-first); `EnfenSummary.tsx` lo muestra en el panel.

**Checkpoint**: las 3 historias core funcionales.

---

## Phase 6: User Story 4 — Geoloc (P4)

**Meta**: botón secundario, nunca el clímax. **Test**: coord dentro → distrito; fuera → "próximamente".

- [ ] T019 [B] [US4] `GeoButton.tsx`: Geolocation API + `booleanPointInPolygon` (Turf) sobre los polígonos servidos por la API → selecciona distrito; fuera de zona → estado "próximamente" (FR-010).

**Checkpoint**: las 4 historias dentro de alcance.

---

## Cola — se genera en el checkpoint (`/speckit-converge`)

> No se detalla ahora (Ppio. de no sobre-planificar la hora 3). Al cerrar P1-P3, correr
> `/speckit-converge` para generar estas tareas con el estado real del código:

- **Deploy (Hito 2):** Front en Vercel + Back en EC2/Elastic IP + RDS → **URL pública funcional**.
- **Tests (Hito 2):** happy path + 1 caso de error de la funcionalidad crítica (`pytest` del clímax `/api/districts`; `jest` del mapa).
- **ADRs** en `docs/adr/` (decisiones: BD real RDS, EC2, Claude, JSONField vs PostGIS).
- **README final** + pulido mobile + verificación del disclaimer.

---

## Dependencias y orden

- **Phase 1 → Phase 2**: setup antes de la fundación.
- **Phase 2 bloquea** todas las historias. Tras T005-T008, **A/B/C arrancan en paralelo**.
- **Orden de degradación si falta tiempo** (de `architecture.md` §6): recortar primero **P4**, luego degradar **P3** a resumen ya cacheado. **P1 y P2 intocables.**

## Oportunidades de paralelismo

- Phase 1: T001/T002/T003 en paralelo (un carril c/u).
- Tras la fundación: Carril A (ETL/datos), B (mapa/panel), C (Claude/endpoints) corren a la vez.
- B y C trabajan contra el **dummy** (T006) hasta que el ETL (T009-T010) puebla la BD real.
