# Vigía

> Plataforma de **alerta temprana y memoria del Fenómeno El Niño** para la costa norte del Perú.
> Convierte la memoria pública del Niño en un momento personal — *tu distrito, cuántas veces se inundó, y qué hacer hoy* — traduciendo lo que el Estado ya publica.

Proyecto para el **Torneo de Vibecoding 2026 (GDG Open × DSCPUCP)**.

## Problemática y usuario

El Fenómeno El Niño golpea al Perú de forma **recurrente y predecible**: los mismos distritos se inundan evento tras evento. El Estado **sí produce buena información** (ENFEN, SENAMHI, INDECI, CENEPRED), pero está fragmentada en varias instituciones, encerrada en PDFs y portales sin API, y **sin traducir a acción**. El problema no es falta de datos; es falta de una **capa de traducción**.

- **Usuario:** ciudadano en un distrito de riesgo de la costa norte (Tumbes, Piura, Lambayeque, La Libertad), no experto.
- **Pregunta que respondemos:** *"Para mi distrito — ¿qué me ha pasado antes, qué viene, y qué hago hoy?"*
- **Salida:** memoria histórica del distrito **+** estado actual del riesgo (ENFEN) **+** recomendación accionable (checklist INDECI).
- **Principio de diseño:** *agencia, no amenaza* — toda respuesta termina en memoria + nivel de riesgo + acción, nunca en un diagnóstico binario.

## MVP (una sola pantalla)

1. **Mapa choropleth de costa norte** (~10–15 distritos para la demo): color = **conteo crudo** de emergencias por lluvia/inundación (SINPAD, filtrado por fenómeno), sin normalizar. Distritos sin registro en **gris explícito** ("sin emergencias registradas ≠ sin riesgo"); nunca verde.
2. **Panel "tu distrito"** (clic en mapa / dropdown): histórico (N emergencias, qué años) + riesgo histórico **y** estado ENFEN actual **yuxtapuestos** (sin fórmula combinada) + **checklist curado de INDECI** por nivel.
3. **Disclaimer al pie:** *"información de referencia, no reemplaza a las autoridades oficiales (INDECI/ENFEN)."*

Alcance cerrado y decisiones bloqueadas en [`CONTEXT.md`](CONTEXT.md).

## Stack tecnológico

| Capa | Elección | Notas |
|---|---|---|
| Frontend | Next.js 14 (App Router) + React 18 + TypeScript | Mapa con **Leaflet**; geoloc point-in-polygon con **Turf.js** (botón secundario). Deploy en **Vercel**. |
| UI | **Tailwind CSS v3 + shadcn/ui** | Componentes en `frontend/src/components/ui`. |
| Backend | Python + **Django + Django REST Framework** | Sirve **JSON estático precocido**. Deploy en **Railway** (gunicorn). |
| Datos | **JSON estático precocido** (sin DB en runtime) | SINPAD + GeoJSON IGN procesados *offline*; nada en vivo en la demo. Postgres/PostGIS = roadmap. |
| Testing | Jest (frontend), PyTest (backend) | Núcleo de testing en ambos lados. |

> Arquitectura completa (módulos, flujo de datos, secuencia, modelo de datos, despliegue): [`docs/architecture.md`](docs/architecture.md).

## Modelos y herramientas de IA

- **Para la demo:** el resumen del comunicado **ENFEN** es **texto precomputado** (2–3 frases en lenguaje claro), coherente con la regla "nada en vivo". La IA es **una sola función acotada — resumir, no recomendar** — y es el *cierre* de la narrativa, no el héroe.
- **El "qué hacer" NO es generado por IA:** es un **checklist curado** de guías oficiales de INDECI por nivel de riesgo (evita alucinaciones peligrosas en un dominio de seguridad).
- **Roadmap:** llamada real a un LLM para resumir el comunicado ENFEN en vivo por nivel de riesgo.

## Instrucciones para correr el proyecto localmente

Monorepo con dos apps independientes. Corre cada una en su propia terminal.

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

### Tests
```bash
cd backend && pytest
cd frontend && npm test
```

## Integrantes y roles

| Integrante | Rol en el proyecto |
|---|---|
| **Luis** | **Datos** — baja el CSV de SINPAD, filtra por fenómeno, agrupa por ubigeo y reconcilia el GeoJSON de costa norte; produce los JSON precocidos para `backend/api/`. |
| **Valeria** | **Frontend / mapa** — Next.js + Leaflet: choropleth, panel "tu distrito" y documentación. |
| **Jhair** | **IA + integración** — resumen del comunicado ENFEN, checklist por nivel y ensamblado end-to-end. |

## Enlaces a documentación adicional

- 📐 [`docs/architecture.md`](docs/architecture.md) — diagramas de arquitectura (Mermaid): módulos, flujo de datos, secuencia, modelo de datos y despliegue.
- 🎯 [`CONTEXT.md`](CONTEXT.md) — alcance cerrado y decisiones bloqueadas (entrada para Spec Kit).
- 📄 [`docs/vigia-brief.md`](docs/vigia-brief.md) — brief extendido: contexto, fuentes de datos, justificación.
- ✅ [`docs/hito-1.md`](docs/hito-1.md) — checklist de cumplimiento del Hito 1.
- 📋 [`docs/tournament_rules.md`](docs/tournament_rules.md) · 🧰 [`docs/stack_and_resources.md`](docs/stack_and_resources.md) · 🏛️ [`docs/adr/`](docs/adr/)

## Estructura del proyecto

```
.
├── backend/          # Django + DRF (sirve JSON precocido; PyTest)
├── frontend/         # Next.js + Leaflet + shadcn/ui (Jest)
├── docs/
│   ├── architecture.md     # ← diagramas de arquitectura (Hito 1)
│   ├── hito-1.md           # checklist del Hito 1
│   ├── vigia-brief.md      # brief extendido
│   ├── tournament_rules.md
│   ├── stack_and_resources.md
│   └── adr/                # Architecture Decision Records
└── CONTEXT.md        # alcance cerrado (Spec Kit)
```
