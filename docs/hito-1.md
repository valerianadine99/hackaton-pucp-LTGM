# Hito 1 — Prototipo de arquitectura

> **Sprint 0 (10:45 — 11:30 AM).** Solo se permite código para un prototipo de arquitectura; el bloque es para **diseñar la arquitectura y documentar**. Esta página mapea cada requisito del hito a su entregable en el repo.

## Checklist de entregables

### README.md — [`/README.md`](../README.md)

| Requisito | Estado | Dónde |
|---|---|---|
| Nombre del proyecto + descripción breve (≤ 3 líneas) | ✅ | Encabezado del README |
| Problemática que resuelve y usuario al que va dirigido | ✅ | §"Problemática y usuario" |
| Stack tecnológico | ✅ | §"Stack tecnológico" |
| Instrucciones para correr el proyecto localmente | ✅ | §"Instrucciones para correr… localmente" |
| Modelos y herramientas de IA que utilizarán | ✅ | §"Modelos y herramientas de IA" |
| Nombres de los integrantes y roles definidos | ✅ | §"Integrantes y roles" (Luis · Valeria · Jhair) |
| Enlaces a documentación adicional | ✅ | §"Enlaces a documentación adicional" |

### Diagramas de arquitectura en `/docs` (Mermaid `.md`)

| Requisito | Estado | Dónde |
|---|---|---|
| Módulos principales del sistema y cómo se comunican | ✅ | [`docs/architecture.md`](architecture.md) §1 |
| Flujo de datos (fuente pública → pantalla) | ✅ | [`docs/architecture.md`](architecture.md) §2 |
| Secuencia del caso de uso principal | ✅ | [`docs/architecture.md`](architecture.md) §3 |
| Modelo de datos + contrato de endpoints | ✅ | [`docs/architecture.md`](architecture.md) §4 |
| Diagrama de despliegue | ✅ | [`docs/architecture.md`](architecture.md) §5 |

### Documentación relevante adicional (opcional)

| Artefacto | Dónde |
|---|---|
| Alcance cerrado / decisiones bloqueadas | [`CONTEXT.md`](../CONTEXT.md) |
| Brief extendido (contexto, fuentes, justificación) | [`docs/vigia-brief.md`](vigia-brief.md) |
| Modelo de datos (PostgreSQL / Django ORM) | [`docs/architecture.md`](architecture.md) §4 |
| Diagrama de despliegue | [`docs/architecture.md`](architecture.md) §5 |
| ADR (decisiones de arquitectura) | [`docs/adr/`](adr/) |

### Obligatorio — Release de GitHub

| Requisito | Estado |
|---|---|
| Lanzar release con el prototipo + toda la documentación | ✅ (al cerrar el sprint) |
| Título del release: **"Prototipo de arquitectura - Vigía"** | ✅ |

## Resumen de la arquitectura (1 párrafo)

Monolito pragmático: **frontend Next.js 14 + Leaflet** ↔ **backend Django + DRF**, acoplados solo por un contrato HTTP/JSON. El backend usa **PostgreSQL en AWS RDS** (desplegado en **EC2 con Elastic IP**) como fuente única de verdad: un **ETL** (management command) lo puebla con la data real de SINPAD (filtrada por fenómeno de lluvia, agrupada por ubigeo), el GeoJSON distrital del IGN (como GeoJSON en `JSONField`) y el resumen de ENFEN generado por una **llamada real a Claude** (cacheada en BD). El mapa choropleth de costa norte es el clímax; al hacer clic en un distrito, el panel yuxtapone memoria histórica y estado ENFEN, y cierra con un checklist curado de INDECI. **Integración real con datos reales, nada fake.** Detalle completo en [`docs/architecture.md`](architecture.md).
