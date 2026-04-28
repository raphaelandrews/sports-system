# Sports System

Multi-league sports competition platform.

## Repo

```text
apps/web/            TanStack Start frontend
apps/api/            FastAPI backend
packages/ui/         shared shadcn/ui components
packages/contracts/  shared API contracts (Zod schemas for forms)
packages/env/        env validation
packages/config/     shared TS config
packages/infra/      Cloudflare/Alchemy deploy code
```

## Stack

- Frontend: TanStack Start, TanStack Router, TanStack Query, Tailwind v4, shadcn/ui, openapi-fetch
- Backend: FastAPI, SQLModel, Alembic, PostgreSQL, JWT auth, APScheduler, SSE
- Tooling: Bun workspace, uv for Python, Turbo, oxlint, oxfmt

## Setup

Prereqs:

- Bun `>=1.3.1`
- Python `>=3.12`
- `uv`
- PostgreSQL

Install:

```bash
bun install
cd apps/api && uv sync
cd /home/raphael/Documents/projects/sports-system
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp packages/infra/.env.example packages/infra/.env
```

Minimum backend env:

- `DATABASE_URL`
- `SECRET_KEY`
- `FRONTEND_URL=http://localhost:3001`
- `BACKEND_PUBLIC_URL=http://localhost:3000`
- `TIMEZONE=America/Sao_Paulo`

Run migrations:

```bash
bun run db:up
```

Run dev:

```bash
bun dev
```

Useful commands:

```bash
bun run dev:web
bun run dev:backend
bun run check-types
bun run check
```

### API Type Generation

Frontend types are generated from the backend OpenAPI spec:

```bash
cd apps/web
bun run gen:types  # generates src/types/api.gen.ts from localhost:3000/openapi.json
```

Add to CI to detect schema drift:

```bash
bun run check:api  # fails if backend spec differs from committed types
```

## Frontend Architecture

Feature-based vertical slices:

```text
apps/web/src/
  app/              # TanStack Router shell (routes stay here)
    routes/...      # file-based routes, never edit routeTree.gen.ts
  features/         # domain vertical slices
    auth/
      api/queries.ts
      components/
      server/       # server functions
    leagues/
    athletes/
    ...
  shared/
    components/     # layouts, generic UI
    lib/            # api client, url builder, date utils
    hooks/
  types/
    api.gen.ts      # auto-generated from OpenAPI (DO NOT EDIT)
```

API client uses `openapi-fetch` for end-to-end type safety:

```typescript
import { client, unwrap } from "@/shared/lib/api";

// Path, params, and response are all typed from api.gen.ts
const data = await unwrap(
  client.GET("/leagues/{league_id}", {
    params: { path: { league_id: 1 } },
  }),
);
```

## Backend Architecture

Domain-driven layers:

```text
apps/api/app/
  main.py           # composition root (wire routers, middleware)
  domain/
    models/         # SQLModel tables
    schemas/        # Pydantic request/response schemas
  features/         # domain vertical slices
    auth/
      router.py
      service.py
      user_repository.py
      token_repository.py
    leagues/
    athletes/
    ...
  shared/
    core/           # auth, security, limiter, scheduler, sse, deps
```

Layering: `router -> service -> repository -> domain model`

## Auth And Roles

Current auth entrypoints:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/oauth/{provider}/start`

Current behavior:

- Password registration creates a user with global role `ATHLETE`
- OAuth login creates a user if missing
- League permissions are handled separately through `league_members`

No API currently promotes a user to `SUPERADMIN`. First superadmin bootstrap is manual in the database.

## Seeds

Startup flow in [`apps/api/app/main.py`](apps/api/app/main.py):

1. Alembic runs on app startup
2. `seed_sports()` inserts canonical sports/modalities once

### First Superadmin

Recommended bootstrap:

1. Start API once so migrations and `seed_sports()` run
2. Register an account in UI or via API
3. Promote that row in the database

Register example:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "name": "Platform Owner",
    "password": "ChangeMe!1"
  }'
```

Promote example:

```sql
UPDATE users
SET role = 'SUPERADMIN'
WHERE email = 'owner@example.com';
```

## Notes

- Backend docs UI: `/docs` and `/redoc` only when `DEBUG=true`
- SSE must connect browser -> backend directly; do not proxy SSE through Workers
- Railway backend must run one `uvicorn` process only
- Frontend types are generated from backend OpenAPI spec; run `gen:types` after schema changes
