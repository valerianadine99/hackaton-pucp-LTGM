# Feature Specification: Vigía — Memoria y acción del Niño en costa norte

**Feature Branch**: `001-vigia-costa-norte`

**Created**: 2026-06-26

**Status**: Draft

**Input**: Alcance cerrado en `CONTEXT.md` y `docs/vigia-brief.md`. Hackathon 3h, 3 ingenieros.

## User Scenarios & Testing *(mandatory)*

> Las historias están priorizadas como slices verticales **independientemente demostrables**.
> Implementar solo P1 ya da un MVP que cuenta la historia. Cada Pn se desarrolla, prueba y
> demuestra por separado — esa es la unidad de trabajo paralelo de las 3 personas.

### User Story 1 - Mapa de memoria: clic en mi distrito (Priority: P1)

Una persona de la costa norte abre Vigía y ve un mapa choropleth de su región coloreado por
cuántas emergencias por lluvia/inundación registró cada distrito. Hace clic en *su* distrito y
ve, de inmediato, su memoria: "tu distrito registró N emergencias (años: …)".

**Why this priority**: Es el clímax de la demo. Sin el mapa coloreado y el clic→memoria no hay
producto. Entrega el momento emocional ("tu distrito se inundó 3 veces") que convence al jurado.

**Independent Test**: Cargar la app con el JSON precargado de costa norte, hacer clic en un
distrito con registro (p. ej. Catacaos) y verificar que el panel muestra el conteo y los años
correctos. Demostrable sin panel de acción ni IA.

**Acceptance Scenarios**:

1. **Given** el mapa cargado con datos precargados, **When** el usuario hace clic en un distrito con registro, **Then** el panel muestra el nombre del distrito, el conteo de emergencias y los años.
2. **Given** un distrito sin registro, **When** el usuario hace clic, **Then** se muestra en **gris** con el mensaje "sin emergencias registradas — no significa sin riesgo" (nunca verde).
3. **Given** el mapa, **When** se observa la leyenda, **Then** indica que el color es conteo crudo sin normalizar por población.

---

### User Story 2 - Acción: nivel de riesgo + checklist INDECI (Priority: P2)

Tras ver su memoria, la persona ve su **nivel de preparación** y un **checklist curado de INDECI**
acorde a ese nivel, para saber qué hacer hoy. La respuesta nunca termina en un dato muerto: siempre
hay una acción.

**Why this priority**: Cierra el principio "agencia, no amenaza". Convierte el dato histórico en algo
accionable. Es el segundo dato de la única pantalla (memoria + acción).

**Independent Test**: Para un distrito dado, verificar que se muestran (a) memoria histórica y estado
ENFEN **yuxtapuestos** sin fórmula combinada y (b) un checklist de 3 niveles correspondiente al nivel.
Demostrable con el detalle de distrito aunque la IA aún no esté integrada.

**Acceptance Scenarios**:

1. **Given** un distrito seleccionado, **When** se abre el panel, **Then** se ven el riesgo histórico y el estado ENFEN actual lado a lado, sin combinarlos en un solo número.
2. **Given** el nivel asignado, **When** se renderiza el checklist, **Then** muestra los ítems curados de INDECI para ese nivel (3 niveles posibles).
3. **Given** cualquier distrito (incluso sin registro), **When** se abre el panel, **Then** siempre hay un checklist base (nunca callejón sin salida).

---

### User Story 3 - Anticipación: resumen ENFEN en lenguaje claro (Priority: P3)

La persona lee un resumen de 2–3 frases del último comunicado ENFEN, en lenguaje claro, como cierre.
Esto representa "el presente" frente a "la memoria".

**Why this priority**: Es el cierre, no el héroe. Aporta el estado actual oficial traducido. Puede
demostrarse al final; el MVP sobrevive sin él si falla.

**Independent Test**: Mostrar el resumen ENFEN precargado (texto) en el panel/sección de estado y
verificar que es legible y coherente con el nivel. Demostrable como bloque de texto independiente.

**Acceptance Scenarios**:

1. **Given** el comunicado ENFEN precargado, **When** el usuario ve la sección de estado, **Then** lee un resumen de 2–3 frases en lenguaje claro.
2. **Given** que el resumen ya fue generado por Claude, **When** ocurre el clímax, **Then** se sirve desde la cache en BD sin re-llamar al modelo (sigue siendo salida real de Claude, no fake).

---

### User Story 4 - Geolocalización como botón secundario (Priority: P4)

La persona puede pulsar un botón secundario "usar mi ubicación" para que la app detecte su distrito
(point-in-polygon). Si está fuera de la costa norte, ve "fuera de zona → próximamente".

**Why this priority**: Conveniencia, nunca el clímax. El clic en el mapa siempre manda. Es lo primero
que se recorta si falta tiempo.

**Independent Test**: Simular una coordenada dentro de la zona → selecciona el distrito correcto;
una fuera de zona → muestra el estado "próximamente".

**Acceptance Scenarios**:

1. **Given** una coordenada dentro de costa norte, **When** se pulsa geoloc, **Then** se selecciona el distrito que la contiene.
2. **Given** una coordenada fuera de zona, **When** se pulsa geoloc, **Then** se muestra "fuera de zona → próximamente" sin romper la app.

### Edge Cases

- Distrito sin registro: gris explícito + mensaje, nunca verde, checklist base igual.
- GeoJSON post-2013 (Veintiséis de Octubre / La Unión en Piura): fusionar en distrito padre y declararlo en nota si no hay polígono actualizado.
- Ubigeo presente en SINPAD pero ausente en GeoJSON (o viceversa): no se pinta y se omite; se registra para la nota de cobertura.
- Sin fuentes externas en vivo en la demo: la data se sirve desde PostgreSQL vía la API; el resumen ENFEN sale de cache si ya fue generado. El clímax no depende de SINPAD/ENFEN externos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST mostrar un mapa choropleth de los distritos de costa norte (Tumbes, Piura, Lambayeque, La Libertad) coloreado por conteo crudo de emergencias por lluvia/inundación.
- **FR-002**: El sistema MUST permitir seleccionar un distrito por clic en el mapa (entrada primaria) y por dropdown (respaldo).
- **FR-003**: Al seleccionar un distrito, el sistema MUST mostrar su memoria histórica: conteo de emergencias y años en que ocurrieron.
- **FR-004**: El sistema MUST mostrar los distritos sin registro en gris explícito con el mensaje "sin emergencias registradas — no significa sin riesgo", nunca en verde.
- **FR-005**: La leyenda MUST declarar que el conteo es crudo y no está normalizado por población.
- **FR-006**: El sistema MUST mostrar el riesgo histórico y el estado ENFEN actual **yuxtapuestos**, sin fórmula combinada ni diagnóstico binario.
- **FR-007**: El sistema MUST mostrar un checklist curado de INDECI según el nivel (3 niveles), y siempre un checklist base para cualquier distrito.
- **FR-008**: El sistema MUST mostrar un resumen de 2–3 frases del comunicado ENFEN en lenguaje claro, generado por una **llamada real a Claude** y cacheado en la BD.
- **FR-009**: El sistema MUST servir datos reales desde PostgreSQL vía la API DRF (integración real end-to-end); sin dependencia de fuentes **externas** en vivo durante la demo.
- **FR-010**: El sistema MUST ofrecer geolocalización como botón secundario con manejo de "fuera de zona → próximamente".
- **FR-011**: El sistema MUST mostrar un disclaimer de pie: "información de referencia, no reemplaza a las autoridades oficiales (INDECI/ENFEN)".
- **FR-012**: El sistema MUST consumir un contrato de datos estable `{ ubigeo, nombre, conteo, nivel, anios[] }` para los distritos, de modo que frontend e IA puedan trabajar contra un dummy mientras se prepara el dato real.
- **FR-013**: El nivel de riesgo histórico se asigna por **umbrales de conteo**: `0 → sin_registro` (gris), `1–2 → bajo`, `3–5 → medio`, `6+ → alto`. Los umbrales son afinables por el carril de Datos al ver la distribución real, manteniendo la regla por umbrales (no cuantiles).

### Key Entities *(include if feature involves data)*

- **Distrito**: unidad geográfica identificada por `ubigeo`. Atributos: `nombre`, `conteo` (emergencias por lluvia/inundación), `nivel` (de riesgo/preparación), `anios[]` (años con emergencias). Geometría: polígono (GeoJSON).
- **Emergencia (origen, no se expone cruda)**: registro SINPAD filtrado por fenómeno (Inundación, Lluvias intensas, Huayco / Movimiento en masa), agrupado por ubigeo para producir `conteo` y `anios[]`.
- **Estado ENFEN**: nivel de alerta nacional/costero + comunicado, precargado y resumido a texto claro.
- **Checklist INDECI**: conjunto curado de acciones por nivel (3 niveles).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En la demo, ~10–15 distritos de costa norte aparecen coloreados convincentemente con datos verídicos.
- **SC-002**: Desde abrir la app, una persona puede hacer clic en su distrito y ver su memoria (conteo + años) en menos de 10 segundos, sin instrucciones.
- **SC-003**: Toda selección de distrito termina mostrando memoria + nivel + acción; 0 callejones sin salida.
- **SC-004**: El flujo del clímax (mapa → clic → panel → resumen) se completa con datos reales servidos por la API desde la BD, sin depender de fuentes externas en vivo.
- **SC-005**: Un distrito sin registro nunca se muestra en verde y siempre incluye el mensaje honesto y un checklist base.

## Assumptions

- Los datos de SINPAD, ENFEN y el GeoJSON IGN/INEI ya están publicados y se descargan/precargan antes de la demo.
- El resumen ENFEN se genera con una llamada real a Claude (Anthropic) y se cachea en la BD; no se usa texto fake.
- La cobertura geográfica es costa norte; nacional es roadmap.
- No hay cuentas de usuario; la app es de una sola pantalla, sin autenticación.
- El backend Django DRF sirve datos reales desde PostgreSQL (AWS RDS); la geometría va como GeoJSON en `JSONField` (sin PostGIS).
- Si la extracción SINPAD+GeoJSON no se completa en 90 min, se usa el plan-B (~15 distritos anclados al reporte COEN) respetando el mismo contrato de datos.
