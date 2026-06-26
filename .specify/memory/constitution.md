<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0
- Bump rationale: MINOR — added Principle VII (Mobile-first y fluido);
  revised Principle II (de "nada en vivo" a "integración real, datos precocidos").
- Principles defined: I. Agencia, no amenaza · II. Integración real, datos precocidos ·
  III. Densidad sobre cobertura (una fuente real) · IV. Traducir, no pedir ·
  V. Registro ≠ predicción · VI. Contratos de datos estables para paralelizar ·
  VII. Mobile-first y fluido
- Added sections: Restricciones del Hackathon (timeboxing) · Flujo de trabajo paralelo
- Removed sections: none
- Templates reviewed:
  ✅ plan-template.md (Constitution Check alineado con principios I–VI)
  ✅ spec-template.md (sin secciones obligatorias en conflicto)
  ✅ tasks-template.md (categorización [P] compatible con Principio VI)
- Deferred TODOs: none
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

### II. Integración real, datos precocidos (NON-NEGOTIABLE)
La demo es **interactiva y con integración real end-to-end**: el frontend llama al backend
Django DRF, y el backend sirve los datos. Lo que está precocido es el **dato**, no la
arquitectura: el backend expone JSON precocido (conteos SINPAD, resumen ENFEN como texto,
checklists) en vez de consultar fuentes externas en vivo. Durante la demo NO se hacen llamadas
a fuentes externas (SINPAD/ENFEN live) ni al modelo de IA — esos datos ya están materializados
en el backend. La optimización (caché, fallback a asset estático si el backend cae) se decide
durante el desarrollo o al final, no se asume desde el inicio.
**Rationale:** una integración real se ve y se demuestra mejor que valores hardcodeados; el
riesgo a evitar es la dependencia de fuentes **externas** en vivo, no la de nuestro propio backend.

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

## Restricciones del Hackathon (timeboxing)

- **Presupuesto:** ~3 horas de build, 3 ingenieros. Torneo de Vibecoding 2026 (GDG × DSCPUCP).
- **Una sola pantalla:** el MVP cuenta la historia completa con dos datos — memoria (mapa) +
  acción (panel). Cualquier feature que no sirva a esa pantalla es roadmap.
- **Espina de datos timeboxed a 90 min:** si la extracción SINPAD + match GeoJSON no sale,
  se activa plan-B (~15 distritos anclados al reporte COEN) sin bloquear los otros carriles.
- **IA = una sola llamada conceptual:** resume el comunicado ENFEN precargado a 2–3 frases.
  En la demo es texto precomputado. La llamada real al modelo es roadmap.
- **Disclaimer de pie obligatorio:** "información de referencia, no reemplaza a las
  autoridades oficiales (INDECI/ENFEN)".

## Flujo de trabajo paralelo

- **Tres carriles por caso de uso**, no por capa: Datos · Frontend/Mapa · IA+Integración.
- El **contrato JSON** (Principio VI) se congela primero; todo lo demás se construye contra él.
- Cada carril entrega un artefacto consumible por los otros (JSON, componente, texto) sin
  necesitar el código interno del otro carril.
- Integración continua al endpoint DRF / asset estático; el front nunca espera al backend real
  (usa dummy hasta que el real esté listo, mismo shape).

## Governance

Esta constitución supersede preferencias individuales durante el build. Las decisiones de
alcance en `CONTEXT.md` (tabla "Decisiones bloqueadas") son vinculantes y no se re-litigan.
Cualquier cambio a un Principio NON-NEGOTIABLE requiere acuerdo de los tres ingenieros y
debe quedar registrado. Ante duda de alcance: ganar la pantalla del clímax primero, todo lo
demás es roadmap. Versionado semántico: MAJOR para cambios incompatibles de principios,
MINOR para principios/secciones nuevas, PATCH para aclaraciones.

**Version**: 1.1.0 | **Ratified**: 2026-06-26 | **Last Amended**: 2026-06-26
