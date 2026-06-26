# Vigía — CONTEXT (alcance cerrado para Spec Kit)

> Entrada para `/specify` (GitHub Spec Kit). Alcance **ya cerrado** tras sesión de grilling.
> Decisiones bloqueadas — esto NO es para re-discutir, es para especificar.
> Contexto extendido y justificación: [`docs/vigia-brief.md`](docs/vigia-brief.md).

## Qué es

Plataforma de **alerta temprana y memoria del Fenómeno El Niño** para Perú. Toma datos públicos
que ya existen (SINPAD, ENFEN), los unifica por distrito, y entrega a cada persona una respuesta
personal y accionable. No le pedimos nada nuevo al Estado: **traducimos lo que ya publica.**

## Propuesta de valor (1 frase)

Convierte la memoria pública del Niño en costa norte en un momento personal —
**tu distrito, cuántas veces se inundó, y qué hacer hoy** — traduciendo lo que el Estado ya publica.

## Restricciones duras

- **~6 horas de build**, equipo de 3 ingenieros (hackathon Torneo de Vibecoding 2026, GDG × DSCPUCP).
- **Integración real, datos precocidos:** demo interactiva con integración end-to-end (frontend → Django DRF → datos). Lo precocido es el *dato* (JSON servido por el backend), no la arquitectura. Sin llamadas a fuentes **externas** en vivo (SINPAD/ENFEN) ni al modelo de IA durante la demo.
- **Una sola pantalla.** El MVP cuenta la historia completa con dos datos: memoria (mapa) + acción (panel).
- Jurado peruano que vivió el Niño Costero 2017 — el framing emocional pesa tanto como lo técnico.

## Principio de diseño transversal: agencia, no amenaza

- NO diagnóstico binario de amenaza ("¿me afecta? sí/no"). SÍ preparación ("¿qué tan listo estás y qué haces?").
- Toda respuesta termina en **memoria + nivel de riesgo + acción**, nunca en callejón sin salida.
- Conservar la especificidad personal ("tu distrito se inundó 3 veces"). Tono accionable, no alarmista.

## Clímax de la demo

Clic en *tu* distrito → mapa de memoria real. **La IA es el cierre, no el héroe.**

---

## Decisiones bloqueadas (grilling)

| # | Decisión | Resuelto |
|---|---|---|
| 1 | Héroe de la demo | **Mapa de memoria** es el clímax; IA es el cierre. |
| 2 | Cobertura geográfica | **Costa norte** (Tumbes, Piura, Lambayeque, La Libertad). Nacional = roadmap. |
| 3 | Qué codifica el color | **Conteo crudo** de emergencias por lluvia/inundación (SINPAD), filtrado por fenómeno. |
| 4 | Normalización | **No** normalizar por población. Nota honesta en leyenda. |
| 5 | Rol de la IA | **Una sola llamada:** resume el comunicado ENFEN precargado a 2-3 frases claras. |
| 6 | Nivel de riesgo | Memoria y presente **yuxtapuestos** (histórico + estado ENFEN), **sin fórmula combinada**. |
| 7 | "Qué hacer" | **Checklist curado** de guías INDECI por nivel (3 niveles). NO generado por IA. |
| 8 | Entrada al distrito | **Clic en mapa** (clímax) + dropdown de respaldo. |
| 9 | Geolocalización | **Botón secundario** (point-in-polygon, Turf.js) con estado "fuera de zona → próximamente". Nunca el clímax. |
| 10 | Distritos sin registro | **Gris explícito**: "sin emergencias registradas — no significa sin riesgo". Nunca verde. Checklist base igual. |

---

## In-scope (se construye hoy)

1. **Mapa choropleth de costa norte** (~100-150 distritos). Color = conteo crudo de emergencias
   por lluvia/inundación (SINPAD, filtrado por fenómeno), sin normalizar + nota en leyenda.
   Nunca verde; gris explícito para "sin registro ≠ sin riesgo".
2. **Panel "tu distrito"** (clic / dropdown): histórico (N emergencias, qué años) +
   riesgo histórico **y** estado ENFEN actual yuxtapuestos (sin fórmula) +
   checklist curado de INDECI por nivel.
3. **IA = una llamada:** resume el comunicado ENFEN **precargado** a lenguaje claro. Sin red en vivo.
4. **Geoloc como botón secundario** con manejo de "fuera de zona". El clímax SIEMPRE por clic.
5. **Disclaimer de pie:** "información de referencia, no reemplaza a las autoridades oficiales (INDECI/ENFEN)."

## Out-of-scope (roadmap / "próximamente")

- Cobertura **Nacional** (la demo es costa norte).
- Normalización por población; ponderación por severidad.
- SENAMHI / COEN en vivo; notificaciones push reales; capa de susceptibilidad CENEPRED.
- Cuentas de usuario; IA generando recomendaciones; multi-fuente simultánea.

---

## Datos

| Fuente | Rol | Qué da | Granularidad |
|---|---|---|---|
| **SINPAD** (datosabiertos.gob.pe) | Memoria | Emergencias históricas 2003→hoy | Distrito (ubigeo) |
| **ENFEN** (enfen.imarpe.gob.pe) | Anticipación | Estado de alerta + comunicado (precargado) | Nacional/costero |
| **GeoJSON distrital** (IGN/INEI) | Geometría | Polígonos de distrito por ubigeo | Distrito |

- **Artefacto precocido:** el output de Datos es un **JSON estático** `{ ubigeo, nombre, conteo, nivel }`
  para costa norte + GeoJSON filtrado con ubigeos reconciliados. El front consume eso **vía el backend DRF**; sin fuentes externas en vivo.
- **Filtro de fenómeno:** solo lluvia → `Inundación`, `Lluvias intensas`, `Huayco / Movimiento en masa`.
  Verificar los strings exactos al bajar el CSV.
- **Susceptibilidad ≠ registro.** Mostramos registro (se inundó), no predicción (es propenso).

## Stack (real, según el repo)

- **Frontend:** Next.js 14 (App Router) + React 18 + TypeScript + **Leaflet** (a agregar). En `frontend/`.
- **Backend:** **Django + Django REST Framework** sirviendo JSON estático precocido. En `backend/`.
- **Datos:** JSON estático precocido (no Postgres/PostGIS en 6h). El backend expone los endpoints; el GeoJSON distrital puede vivir en el front como asset.
- **IA:** para la demo, el resumen del ENFEN es **texto precomputado/estático** (coherente con "sin fuentes externas en vivo"); igual se **sirve por el endpoint DRF**, no hardcodeado en el front. Llamada real al modelo = roadmap.

Monolito pragmático: `frontend` (Next.js) ↔ `backend` (Django DRF). Sin microservicios.

## Endpoints (Django DRF — a construir sobre el starter de `api/`)

- `GET /api/districts` → lista costa norte `{ ubigeo, nombre, conteo, nivel, anios[] }` para el choropleth.
- `GET /api/districts/<ubigeo>` → detalle: histórico + resumen ENFEN (texto) + checklist por nivel.
- `GET /api/enfen` → estado/comunicado ENFEN resumido (precargado).
- (existe ya) `GET /health`, `GET /api/items` (mock del starter — se reemplaza).

## Reparto (3 personas, paralelo desde 0:30)

- **Datos:** baja CSV SINPAD, filtra por fenómeno, agrupa por ubigeo → JSON de conteos + GeoJSON costa norte reconciliado; lo carga en `backend/api/`.
- **Frontend/mapa:** Next.js + Leaflet, choropleth + panel de detalle (arranca contra los endpoints DRF / JSON dummy de 3 distritos).
- **IA + integración:** resume el comunicado ENFEN precargado (texto) por nivel; pega todo.

## Riesgos vivos (orden de prioridad)

1. 🔴→🟡 **Espina de datos (SINPAD CSV + match GeoJSON).** Mitigación: tarea #1 **timeboxed 90 min**;
   si no sale, plan-B = ~15 distritos anclados al reporte COEN (Piura 91.835 damnificados; Catacaos ≈45 mil).
2. 🟡 **Strings exactos del campo fenómeno** en SINPAD — verificar al bajar el CSV.
3. 🟡 **GeoJSON pos-2013** (Veintiséis de Octubre / La Unión, en Piura): conseguir actualizado o
   fusionar en distrito padre + declararlo en nota.
4. 🟢 **Responsabilidad:** mitigado por recomendaciones curadas de fuente oficial + disclaimer de pie.

## Regla de oro

Una fuente real bien hecha (SINPAD verídico) le gana a cinco mockeadas. Densidad sobre cobertura.
El clímax necesita ~10-15 distritos coloreados convincentemente, no los 1.870.
