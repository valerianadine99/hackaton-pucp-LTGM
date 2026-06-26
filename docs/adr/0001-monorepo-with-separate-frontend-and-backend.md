# Monorepo with separate frontend and backend

We keep the Next.js frontend and Django backend as two independent apps in a single repository (`frontend/` and `backend/`) rather than splitting them into two repos or merging them into one runtime. This gives us one commit history and one GitHub release to manage under tournament time pressure, while still letting each app deploy independently (Vercel for the frontend, Railway/AWS for the backend) and own its toolchain and tests.

## Consequences

- Each app has its own dependencies, test runner, and deploy target; there is no shared build step.
- The frontend talks to the backend over HTTP using `NEXT_PUBLIC_API_BASE_URL`, so the two are only coupled by the API contract.
