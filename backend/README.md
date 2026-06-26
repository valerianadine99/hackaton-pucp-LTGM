# Backend — Vigia API

Django REST Framework API for Vigía — emergency preparedness for the northern coast of Peru. Serves district emergency history and El Niño (ENFEN) alert data.

## Architecture

Layered domain-driven structure:

```
apps/
  core/               # Custom exceptions, exception handler, health endpoint
  districts/          # District model + checklist, selectors, services, API
  enfen/              # ENFEN summary model, selectors, services, API
config/
  settings/
    base.py           # Shared configuration
    local.py          # Development overrides (DEBUG=True, open CORS)
    production.py     # Production overrides (DEBUG=False)
```

Each domain app follows the selector → service → API pattern:
- **Selectors** — pure read queries, no side effects
- **Services** — business logic (risk level thresholds, Claude API calls)
- **API** — one file per endpoint, class-based DRF views

## Setup

```bash
cd backend
uv sync
```

Start the PostgreSQL dev database:

```bash
docker compose up -d        # from repo root
```

Copy and configure environment:

```bash
cp .env.example .env        # edit ANTHROPIC_API_KEY and other vars
```

Run migrations:

```bash
uv run python manage.py migrate
```

## Data ingestion

Populate the DB from the curated inputs in `data/processed/` (see `data/DATA_DICTIONARY.md`):

```bash
uv run python manage.py ingest_data           # District + geometry + Emergency + ChecklistItem (+ENFEN metadata)
uv run python manage.py ingest_data --enfen    # also calls Claude for the ENFEN summary (needs ANTHROPIC_API_KEY)
```

Idempotent (re-running replaces the data). Loads **208 districts** (207 with records + 1 gray;
197 with polygons, 11 pending geometry reconciliation), **3,814 emergencies**, **15 checklist items**.
Spanish source values (`alto/medio/bajo`, phenomena) are mapped to the English model codes during ingest;
user-facing text (checklist, ENFEN summary, phenomenon labels) stays in Spanish. Without `--enfen` the
ENFEN summary is left empty (no fake text — Principle II); run with the key to generate the real cached summary.

## Run

```bash
uv run python manage.py runserver    # http://localhost:8000
```

## Test

```bash
uv run pytest -v
```

## Endpoints

- `GET /health` — liveness probe
- `GET /api/districts` — list all districts with risk level summary
- `GET /api/districts/geojson` — FeatureCollection (geometry from DB) for the choropleth
- `GET /api/districts/<ubigeo>` — district detail: derived `memory` (streak, peak year, dominant phenomenon, per-year intensity) + rich `checklist` (emoji/title/detail)
- `GET /api/enfen` — current El Niño alert `state` (Spanish) and Claude-generated `summary`

API field names are in English; user-facing **values** (checklist text, ENFEN state/summary, phenomenon labels) are in Spanish. Risk `level` is a code (`no_record/low/medium/high`) the frontend maps to Spanish labels.

### Risk levels (FR-013 — threshold rule, tuned to the real distribution)

| `count` | `level` (code) | label |
|---------|----------------|-------|
| 0       | `no_record`    | sin registro (gris) |
| 1–7     | `low`          | bajo  |
| 8–24    | `medium`       | medio |
| 25+     | `high`         | alto  |

Thresholds are tuned (not literal `1-2/3-5/6+`) so the choropleth is varied; the rule stays count-based (not quantiles). Kept in sync with `data/scripts/build_districts.py` and `DistrictService.compute_level`.

## Config

Copy `.env.example` to `.env` and adjust:

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | `True` for development |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hosts |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins |
| `DATABASE_URL` | PostgreSQL connection URL |
| `ANTHROPIC_API_KEY` | API key for Claude (used by ENFEN service) |
| `DJANGO_SETTINGS_MODULE` | Settings module (`config.settings.local` or `config.settings.production`) |

## Deploy

Set the start command:

```
gunicorn config.wsgi --bind 0.0.0.0:$PORT
```

Set `DJANGO_SETTINGS_MODULE=config.settings.production`, `CORS_ORIGINS` to your frontend URL, `ALLOWED_HOSTS` to your backend host, and a real `SECRET_KEY` with `DATABASE_URL` pointing to your production database.
