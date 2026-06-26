# Vigía — Brief de proyecto

> Nombre tentativo. Plataforma de alerta temprana y memoria del Fenómeno El Niño para Perú.
> Documento semilla para `/specify` (Spec Kit) y para `grill-me`. Pensado para ser cuestionado y refinado, no como spec final.

---

## 1. Contexto

- **Evento:** hackathon (Torneo de Vibecoding 2026, GDG Open × DSCPUCP).
- **Restricción dura:** ~6 horas de build, equipo de 3 ingenieros.
- **Reto:** solución relacionada al Estado peruano / problema ciudadano real.
- **Jurado:** peruano; vivió el Niño Costero 2017. El framing emocional importa tanto como lo técnico.

## 2. Problema

El Fenómeno El Niño golpea al Perú de forma **recurrente y predecible**: los mismos distritos se inundan evento tras evento. El Estado **sí produce buena información** (ENFEN, SENAMHI, INDECI, CENEPRED), pero está:

- **Fragmentada** en cinco o seis instituciones, cada una con su portal y formato.
- **En PDFs y portales sin API** limpia ni documentada.
- **Sin traducir a acción**: el comunicado técnico nunca llega al ciudadano como algo que entienda y pueda hacer.

Resultado: se sabe que el Niño viene, y aun así nadie actúa con anticipación. **El problema no es falta de datos; es falta de una capa de traducción.**

## 3. Solución

Una capa única que toma los datos públicos que **ya existen**, los unifica en un modelo geoespacial por distrito, y entrega a cada persona una respuesta personal, concreta y accionable. No le pedimos nada nuevo al Estado: traducimos lo que ya publica.

**Propuesta de valor en una línea:** convertir un fenómeno abstracto en una respuesta personal y accionable — *tu distrito, tu historial, tu plan*.

## 4. Principio de diseño: agencia, no amenaza

Decisión de producto que la spec debe respetar de forma transversal.

- **NO** plantear la experiencia como diagnóstico binario de amenaza ("¿esto me afecta? sí/no"). Eso entrega miedo sin agencia, da salida para desentenderse, y promete una certeza que el dato (probabilístico) no tiene.
- **SÍ** plantearla como preparación: *"¿qué tan listo estás y qué puedes hacer?"*.
- Toda respuesta termina en **memoria + nivel de riesgo + acción**, nunca en un callejón emocional sin salida.
- Conservar la **especificidad personal** ("tu distrito se inundó 3 veces") — es el gancho. No diluir en lenguaje genérico de "preparémonos todos".
- Tono: **accionable, no alarmista** (*actionable, not alarmist*).

## 5. Usuario y pregunta central

- **Usuario:** ciudadano en un distrito de riesgo (costa norte / zonas inundables), no experto.
- **Pregunta que respondemos (reframeada):** "Para mi distrito — ¿qué me ha pasado antes, qué viene, y qué hago hoy?"
- **Salida:** memoria histórica del distrito + estado actual del riesgo + recomendación accionable.

## 6. Fuentes de datos

Naturaleza, granularidad y rol de cada fuente. **Insight crítico de granularidad:** el registro histórico (SINPAD) es a nivel **distrito (ubigeo)**, no punto exacto — por eso se representa como **áreas (choropleth)**, no chinchetas.

| Fuente | Rol (horizonte) | Qué da | Formato | Granularidad | Dificultad |
|---|---|---|---|---|---|
| **SINPAD** (datosabiertos.gob.pe) | Memoria (T+años) | Emergencias históricas 2003→hoy | CSV/JSON | Distrito (ubigeo) | Baja ← empezar aquí |
| **ENFEN** (enfen.imarpe.gob.pe) | Anticipación (T−semanas) | Estado de alerta + comunicados | PDF/texto | Nacional/costero | Media |
| **SENAMHI** (senamhi.gob.pe) | Tiempo real (T=0) | Lluvia, ríos, estaciones, PISCO | Portal/grillas | Estación/grilla | Media-alta (sin API limpia) |
| **INDECI / COEN** (coen.indeci.gob.pe) | Tiempo real (T=0) | Emergencias activas | Boletín/reporte | Distrito/sector | Media |
| **CENEPRED / SIGRID** (sigrid.cenepred.gob.pe) | Anticipación (T−semanas) | Susceptibilidad / escenarios de riesgo (incl. capa Niño 1983/1998/2017/2023) | Shapefile/raster/PDF | Polígono | Media-alta (archivos pesados) |

- **Susceptibilidad ≠ registro:** las capas de CENEPRED dicen "esta área es propensa a inundarse" (predicción), no "esta área se inundó en 2017" (registro). No confundir en la UI.
- **Puntos exactos por evento:** no existen de forma limpia/descargable. No perseguirlos.

## 7. Arquitectura base

Monolito pragmático. Sin microservicios. Stack alineado al del equipo.

```
FUENTES (3 horizontes)
  Anticipación: ENFEN · CENEPRED   Tiempo real: SENAMHI · COEN   Memoria: SINPAD
        │
        ▼  INGESTA
  Workers: scrapers (Playwright) · PDF parser (LLM) · dataset loader (CSV)
        │
        ▼  NORMALIZACIÓN + STORE
  Esquema unificado de eventos → Postgres + PostGIS (Drizzle ORM)
  modelo: evento · geo · severidad · fecha · fuente
        │
        ▼  INTELIGENCIA
  Resumen accionable por distrito (Vercel AI SDK) — comunicado técnico → "qué hacer"
        │
        ▼  API (Hono)  →  FRONTEND (Next.js / Vercel, Leaflet)
```

**Stack:** TypeScript · Next.js · Hono · Drizzle ORM · Postgres + PostGIS · Vercel AI SDK · Leaflet.

## 8. MVP de 6 horas — una sola pantalla

Despiadadamente recortado. El MVP cuenta la historia completa con **dos datos**: memoria (mapa) + anticipación/acción (panel con IA).

### In scope (lo que se construye hoy)
1. **Mapa choropleth distrital con memoria histórica real (SINPAD).** El usuario ve su distrito coloreado por cuántas veces lo golpeó el Niño. Zoom narrativo nación → región → distrito.
2. **Panel "tu distrito"** (al hacer clic): histórico (cuántas emergencias, qué años) + **estado actual del ENFEN resumido por IA** en lenguaje claro + un **"qué hacer"** accionable.

### Out of scope (roadmap, NO se construye hoy)
- SENAMHI en tiempo real.
- Scraping en vivo de COEN.
- Notificaciones push reales.
- Capa de susceptibilidad de CENEPRED (shapefiles pesados).
- Geolocalización automática / cuentas de usuario.
- Multi-fuente simultánea.

### Regla de oro
Una fuente real bien hecha (SINPAD verídico) le gana a cinco mockeadas. **Nada en vivo en la demo:** precargar SINPAD y el último comunicado ENFEN para que corra sin depender de red.

## 9. Reparto del equipo (3 personas, paralelo desde 0:30)

- **Datos:** baja CSV de SINPAD, agrupa por ubigeo, genera JSON de conteos + consigue GeoJSON distrital actualizado (IGN).
- **Frontend/mapa:** Next.js + Leaflet, choropleth distrital + panel de detalle.
- **IA + integración:** Vercel AI SDK, resumen accionable del comunicado ENFEN (precargado) por nivel de riesgo; pega todo.

## 10. Timeline

| Tramo | Foco |
|---|---|
| 0:00–0:30 | Setup, alcance cerrado, reparto |
| 0:30–2:00 | Cada quien su pieza en paralelo |
| 2:00–4:00 | Integración mapa + datos reales |
| 4:00–5:00 | Capa IA + pulido visual |
| 5:00–6:00 | Ensayar la demo y guión (no negociable) |

## 11. Supuestos (cuestionar en grill-me)

- El CSV de SINPAD es descargable y parseable dentro del presupuesto de tiempo.
- El conteo por ubigeo es suficiente como proxy de "impacto histórico" (no pondera severidad ni población).
- Un comunicado ENFEN precargado basta para demostrar el valor de la IA sin scraping en vivo.
- El jurado valora foco (MVP recortado) por encima de cobertura (muchas fuentes a medias).
- El GeoJSON distrital actualizado (post-2013, con Veintiséis de Octubre / La Unión) está disponible a tiempo.

## 12. Preguntas abiertas (para grill-me / `/clarify`)

- ¿Cómo se define el "nivel de riesgo" del distrito hoy? ¿Solo histórico, o se combina con el estado ENFEN actual? ¿Con qué fórmula?
- ¿El "qué hacer" es contenido estático curado o generado por IA? Si es IA, ¿cómo se evita que alucine recomendaciones peligrosas?
- ¿Qué pasa con distritos sin historial registrado? (No deben quedar como "sin riesgo" → riesgo de falsa tranquilidad.)
- ¿El conteo de emergencias debe normalizarse por población o por nº de eventos Niño para ser justo entre distritos?
- ¿Cómo entra el usuario a "su" distrito sin geolocalización? (selector manual vs. búsqueda).
- ¿La memoria histórica filtra solo emergencias asociadas a lluvias/Niño, o muestra todas (sismos, etc.)? Definir el filtro de fenómeno.
- Privacidad/responsabilidad: ¿la plataforma puede ser leída como consejo oficial? ¿Disclaimer necesario?

## 13. Roadmap post-MVP

- Integrar SENAMHI (lluvia/ríos) y COEN (emergencias activas) en tiempo real.
- Notificaciones push geolocalizadas (alerta temprana real).
- Capa de susceptibilidad CENEPRED (predicción) sobre la memoria (registro).
- Conteo SINPAD real por ubigeo reemplazando cifras ilustrativas.
- Cobertura nacional a nivel de los 1800+ distritos.

## 14. Notas de datos / honestidad

- Las cifras por distrito del ejemplo Piura 2017 son **ilustrativas**, ancladas al reporte COEN (Piura: 91.835 damnificados; Catacaos ≈ 45 mil, entre los dos más afectados con Cura Mori). El conteo exacto sale de SINPAD por ubigeo.
- Geometrías distritales: reales, pero el GeoJSON de referencia usa límites previos a 2013 (sin Veintiséis de Octubre / La Unión como distritos separados).

## 15. Fuentes oficiales

- ENFEN — https://enfen.imarpe.gob.pe/
- SENAMHI — https://www.senamhi.gob.pe/
- INDECI / COEN — https://portal.indeci.gob.pe/ · https://coen.indeci.gob.pe/
- SINPAD (datos abiertos) — https://www.datosabiertos.gob.pe/ (buscar "emergencias históricas SINPAD")
- CENEPRED / SIGRID — https://sigrid.cenepred.gob.pe/
