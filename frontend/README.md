# Frontend — Next.js

App Router + TypeScript. Talks to the Django backend through a typed client (`src/lib/api.ts`) whose base URL is set via `NEXT_PUBLIC_API_BASE_URL`.

## Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local   # point at your backend
```

## Run

```bash
npm run dev                        # http://localhost:3000
```

## Test

```bash
npm test
```

## Deploy (Vercel)

Import the repo, set the project root to `frontend/`, and add the env var `NEXT_PUBLIC_API_BASE_URL` pointing at your deployed backend URL.
