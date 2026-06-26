# [Project Name]

> _Short description (max 3 lines). Fill in once the theme is revealed._

A base project for the **VibeCoding Tournament (DSC PUCP)**: a Next.js + Django starter wired over mock endpoints, with a testing core on both sides and the documentation structure the rubric rewards.

## Problem & Target User

_To be defined on the day of the event._

## Tech Stack

| Layer | Choice | Deploy |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript | Vercel |
| Backend | Python + Django (REST Framework) | Railway / AWS |
| Database | _Undecided — Postgres or DynamoDB (+ Vector DB if AI needs it)_ | — |
| Testing | Jest (frontend), PyTest (backend) | — |

## AI Models

_To be defined — list the models/tools used here._

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
    ├── tournament_rules.md
    ├── stack_and_resources.md
    └── adr/          # Architecture Decision Records
```

## Team

| Member | Role |
|---|---|
| Valeria | _role TBD_ |
| Jhair | _role TBD_ |
| Luis | _role TBD_ |
