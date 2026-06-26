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
- `GET /api/districts/<ubigeo>` — district detail with checklist and ENFEN summary
- `GET /api/enfen` — current El Niño alert state and Claude-generated summary

### Risk levels (FR-013)

| `conteo` | `nivel`        |
|----------|----------------|
| 0        | `sin_registro` |
| 1–2      | `bajo`         |
| 3–5      | `medio`        |
| 6+       | `alto`         |

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
