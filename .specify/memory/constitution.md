<!--
Sync Impact Report
- Version change: 1.1.0 → 2.0.0
- Bump rationale: MAJOR — redefinición del NON-NEGOTIABLE II (de "datos precocidos / IA
  precomputada" a "datos reales en BD PostgreSQL/RDS + llamada real al modelo"); añadido
  Principle VIII (Escalabilidad y mantenibilidad); ajustada restricción de IA y flujo paralelo.
  Motivado por iteración de arquitectura con el equipo (la arquitectura previa se generó con
  CONTEXT.md desactualizado).
- Principles defined: I. Agencia, no amenaza · II. Integración real, datos reales ·
  III. Densidad sobre cobertura (una fuente real) · IV. Traducir, no pedir ·
  V. Registro ≠ predicción · VI. Contratos de datos estables para paralelizar ·
  VII. Mobile-first y fluido · VIII. Escalabilidad y mantenibilidad
- Added sections: Restricciones del Hackathon (timeboxing) · Flujo de trabajo paralelo
- Removed sections: none
- Artefactos a re-sincronizar con esta versión (PENDIENTE):
  ⚠ docs/architecture.md (quitar "sin BD en runtime"/"nada en vivo" → BD real RDS + IA real)
  ⚠ docs/hito-1.md (resumen 1-párrafo dice "sin base de datos en runtime" / "nada en vivo")
  ⚠ specs/001-vigia-costa-norte/plan.md (Technical Context: añadir Postgres/RDS, IA real)
  ⚠ specs/001-vigia-costa-norte/spec.md (FR-009/SC-004: integración real, no "sin red")
  ⚠ CONTEXT.md (Stack: "JSON estático precocido (no Postgres)" → Postgres/RDS)
- Deferred TODOs: definir modelo de IA exacto; estrategia de geometría (PostGIS vs JSONField)
-->

# Vigía Constitution

Plataforma de alerta temprana y memoria del Fenómeno El Niño para Perú (costa norte).
Esta constitución gobierna el build de la hackathon: las decisiones de alcance ya están
cerradas en `CONTEXT.md` y `docs/vigia-brief.md`. Aquí fijamos los principios que NO se
re-discuten durante el build.

## Core Principles

### I. Agencia, no amenaza (NON-NEGOTIABLE)
NO existe diagnóstico binario de amenaza ("¿me afecta? sí/no"). SÍ preparación
("¿qué tan listo estás y qué haces?"). Toda respuesta de la app MUST terminar en la
tríada **memoria + nivel de riesgo + acción**, nunca en un callejón sin salida.
Se conserva la especificidad personal ("tu distrito se inundó 3 veces"). Tono accionable,
nunca alarmista. **Rationale:** el jurado peruano vivió el Niño Costero 2017; el framing
emocional pesa tanto como lo técnico.

### II. Integración real, datos reales (NON-NEGOTIABLE)
La demo es **interactiva y con integración real end-to-end** con **datos reales**, nunca
hardcodeados ni fake. El frontend llama al backend Django DRF; el backend consulta una **base
de datos real (PostgreSQL en AWS RDS)** donde se cargó la data de las fuentes oficiales (SINPAD,
ENFEN, GeoJSON IGN/INEI) mediante un ETL. La IA hace una **llamada real al modelo** para resumir
el comunicado ENFEN — la demo NO se permite usar texto fake. Lo "precocido" es el momento de la
**ingesta** (el ETL corre antes del evento para cargar la BD), no el dato mostrado: lo que el
usuario ve sale de la BD vía la API, en vivo. Cachear una respuesta **real** del modelo es válido
(sigue siendo dato real); inventar texto no lo es.
**Rationale:** es un torneo de IA y la arquitectura vale 40%; una integración real con BD y modelo
real se demuestra y se defiende ante el jurado mucho mejor que valores estáticos.

### III. Densidad sobre cobertura — una fuente real
Una sola fuente real bien hecha (SINPAD verídico) le gana a cinco mockeadas. El clímax
necesita ~10–15 distritos coloreados convincentemente, no los 1.870. Si un dato no se puede
verificar contra fuente oficial, se marca explícitamente, no se inventa.
**Rationale:** credibilidad > amplitud; un dato falso detectado destruye la confianza.

### IV. Traducir, no pedir
No se le pide nada nuevo al Estado. La app MUST construirse solo sobre lo que ya se publica
(SINPAD, ENFEN, GeoJSON IGN/INEI). El valor está en unificar y traducir, no en generar dato nuevo.

### V. Registro ≠ predicción
Mostramos **registro** (se inundó, conteo histórico), nunca **predicción** o susceptibilidad
(es propenso). La leyenda MUST ser honesta: "sin emergencias registradas — no significa sin
riesgo". Distritos sin registro van en **gris explícito**, nunca verde.

### VI. Contratos de datos estables para paralelizar
Las tres personas trabajan en paralelo desacopladas por un contrato JSON congelado desde
el minuto 0:30: `{ ubigeo, nombre, conteo, nivel, anios[] }`. Frontend e IA arrancan contra
un dummy de 3 distritos que respeta ese shape mientras Datos llena el real. El contrato
MUST NOT cambiar de forma sin acuerdo de los tres. **Rationale:** en 3h no hay tiempo para
re-sincronizar interfaces; el contrato es la única dependencia entre carriles.

### VII. Mobile-first y fluido (NON-NEGOTIABLE)
La app se consume en **celular**. Todo componente MUST diseñarse responsive desde el inicio
(no "desktop y luego lo adaptamos"). El mapa choropleth y el panel de detalle MUST ser usables
y fluidos en pantalla de teléfono; el clímax (clic/tap en el distrito) MUST funcionar bien al
tacto, con targets táctiles cómodos (≥44px). **Rationale:** el usuario real y la demo ocurren
en el teléfono; un layout pensado para desktop se rompe en el momento que importa.

### VIII. Escalabilidad y mantenibilidad (NON-NEGOTIABLE)
Aunque sea un MVP, la arquitectura MUST diseñarse para escalar y mantenerse. **Toda la
información vive en la BD del backend** (PostgreSQL/RDS), no embebida en el frontend: cargar
data o GeoJSON en el front lo vuelve pesado, no cacheable y no escalable. El backend es la única
fuente de verdad y expone la data por la API. Separación limpia de capas (modelos ORM · serializers
· vistas), sin lógica de negocio en el frontend, sin datos hardcodeados. **Rationale:** el rubro
de Ingeniería vale 40% y el jurado puede preguntar por cualquier decisión; un MVP bien estructurado
escala a Nacional (roadmap) sin reescribir.

## Restricciones del Hackathon (timeboxing)

- **Presupuesto:** ~3 horas de build, 3 ingenieros. Torneo de Vibecoding 2026 (GDG × DSCPUCP).
- **Una sola pantalla:** el MVP cuenta la historia completa con dos datos — memoria (mapa) +
  acción (panel). Cualquier feature que no sirva a esa pantalla es roadmap.
- **Espina de datos timeboxed a 90 min:** si la extracción SINPAD + match GeoJSON no sale,
  se activa plan-B (~15 distritos anclados al reporte COEN) sin bloquear los otros carriles.
- **IA = llamada real al modelo:** resume el comunicado ENFEN a 2–3 frases con una llamada real.
  Se permite cachear la respuesta real para estabilidad; no se permite texto fake.
- **Disclaimer de pie obligatorio:** "información de referencia, no reemplaza a las
  autoridades oficiales (INDECI/ENFEN)".

## Flujo de trabajo paralelo

- **Tres carriles por caso de uso**, no por capa: Datos · Frontend/Mapa · IA+Integración.
- El **contrato JSON** (Principio VI) se congela primero; todo lo demás se construye contra él.
- Cada carril entrega un artefacto consumible por los otros (JSON, componente, texto) sin
  necesitar el código interno del otro carril.
- Integración continua contra el endpoint DRF; el front nunca espera al backend real durante el
  desarrollo (usa un dummy en memoria con el mismo shape del contrato, **solo en dev**). El dummy
  NUNCA llega a la demo: para entonces la data real ya vive en la BD.

## Governance

Esta constitución supersede preferencias individuales durante el build. Las decisiones de
alcance en `CONTEXT.md` (tabla "Decisiones bloqueadas") son vinculantes y no se re-litigan.
Cualquier cambio a un Principio NON-NEGOTIABLE requiere acuerdo de los tres ingenieros y
debe quedar registrado. Ante duda de alcance: ganar la pantalla del clímax primero, todo lo
demás es roadmap. Versionado semántico: MAJOR para cambios incompatibles de principios,
MINOR para principios/secciones nuevas, PATCH para aclaraciones.

**Version**: 2.0.0 | **Ratified**: 2026-06-26 | **Last Amended**: 2026-06-26
