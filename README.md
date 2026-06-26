# Vigía

> Plataforma de alerta temprana y memoria del Fenómeno El Niño para Perú: convierte un fenómeno abstracto en una respuesta personal y accionable — *tu distrito, tu historial, tu plan*.

Proyecto para el **Torneo de Vibecoding 2026 (GDG Open × DSCPUCP)**: un starter Next.js + Django cableado sobre endpoints mock, con núcleo de testing en ambos lados y la estructura de documentación que premia el rúbrica.

📄 **Brief completo del proyecto:** [`docs/vigia-brief.md`](docs/vigia-brief.md) — contexto, problema, principio de diseño (agencia, no amenaza), fuentes de datos, arquitectura, alcance del MVP y preguntas abiertas. Es el documento semilla para `grill-me` / `/specify`.

## Problem & Target User

El Fenómeno El Niño golpea al Perú de forma recurrente y predecible: los mismos distritos se inundan evento tras evento. El Estado **sí produce buena información** (ENFEN, SENAMHI, INDECI, CENEPRED), pero está fragmentada en varias instituciones, encerrada en PDFs y portales sin API, y **sin traducir a acción**. El problema no es falta de datos; es falta de una **capa de traducción**.

- **Usuario:** ciudadano en un distrito de riesgo (costa norte / zonas inundables), no experto.
- **Pregunta que respondemos:** "Para mi distrito — ¿qué me ha pasado antes, qué viene, y qué hago hoy?"
- **Salida:** memoria histórica del distrito + estado actual del riesgo + recomendación accionable.

Detalle completo en el [brief](docs/vigia-brief.md) (§2 Problema, §4 Principio de diseño, §5 Usuario).

## MVP (6 horas) — una sola pantalla

1. **Mapa choropleth distrital** con memoria histórica real (SINPAD): cada distrito coloreado por cuántas veces lo golpeó el Niño.
2. **Panel "tu distrito"** (al hacer clic): histórico + estado actual del ENFEN resumido por IA + un "qué hacer" accionable.

Alcance, *out of scope* y la regla de oro ("una fuente real bien hecha le gana a cinco mockeadas") en el [brief §8](docs/vigia-brief.md).

## Tech Stack

| Layer | Choice | Deploy |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript + Leaflet | Vercel |
| Backend | Python + Django (REST Framework) | Railway / AWS |
| Database | Postgres + PostGIS | — |
| Testing | Jest (frontend), PyTest (backend) | — |

> El brief §7 plantea una arquitectura de referencia en TypeScript (Hono · Drizzle); este repo arranca con el starter Django + Next.js ya cableado. Confirmar el stack final en `grill-me` antes de construir.

## AI Models

Resumen accionable del comunicado ENFEN por nivel de riesgo (comunicado técnico → "qué hacer") vía **Vercel AI SDK**. Modelos concretos a definir.

## Local Setup

This is a monorepo with two independent apps. Run each in its own terminal.

**Backend** (`http://localhost:8000`)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
python manage.py runserver
```

**Frontend** (`http://localhost:3000`)
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

## Tests

```bash
cd backend && pytest
cd frontend && npm test
```

## Project Structure

```
.
├── backend/          # Django app (mock endpoints + PyTest)
├── frontend/         # Next.js app (typed API client + Jest)
└── docs/             # Rules, stack notes, architecture diagrams, ADRs
    ├── vigia-brief.md       # ← project brief (seed for grill-me / /specify)
    ├── tournament_rules.md
    ├── stack_and_resources.md
    └── adr/          # Architecture Decision Records
```

## Team

Reparto por área (brief §9):

| Member | Área |
|---|---|
| Valeria | _por confirmar_ |
| Jhair | _por confirmar_ |
| Luis | _por confirmar_ |

- **Datos:** baja CSV de SINPAD, agrupa por ubigeo, genera JSON de conteos + GeoJSON distrital (IGN).
- **Frontend/mapa:** Next.js + Leaflet, choropleth distrital + panel de detalle.
- **IA + integración:** Vercel AI SDK, resumen accionable del comunicado ENFEN por nivel de riesgo; pega todo.
