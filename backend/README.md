# Backend — Django

Mock-first API built on Django + Django REST Framework. Endpoints serve static data so the frontend is unblocked from hour one; swap in a real data source once the theme is known.

> No database is configured yet — the API returns static mock data, so there are no migrations to run. Add a `DATABASES` setting (and the `auth`/`admin` apps) in `config/settings.py` when you wire in a real data source.

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
```

## Run

```bash
python manage.py runserver         # http://localhost:8000  (browsable API at /api/items)
```

## Test

```bash
pytest
```

## Endpoints

- `GET /health` — liveness probe
- `GET /api/items` — list mock items (happy path)
- `GET /api/items/{id}` — get one item, 404 if missing (error case)

## Config

Copy `.env.example` to `.env` and adjust. `CORS_ORIGINS` is a comma-separated list of allowed frontend origins; `ALLOWED_HOSTS` is a comma-separated list of hosts Django will serve.

## Deploy (Railway)

Set the start command (or rely on the `Procfile`):

```
gunicorn config.wsgi --bind 0.0.0.0:$PORT
```

Set `CORS_ORIGINS` to your deployed frontend URL, `ALLOWED_HOSTS` to your backend host, and a real `SECRET_KEY` with `DEBUG=False`.
