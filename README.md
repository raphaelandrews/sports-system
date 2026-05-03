# SportsHub

Multi-league sports competition platform with AI-powered features.

## Repo

```text
apps/web/            TanStack Start frontend
apps/api/            FastAPI backend
packages/ui/         shared shadcn/ui components
packages/contracts/  shared API contracts (Zod schemas for forms)
packages/env/        env validation
packages/config/     shared TS config
packages/infra/      Cloudflare deploy
```

## Stack

- **Frontend**: TanStack Start, TanStack Router, TanStack Query, Tailwind v4, shadcn/ui, openapi-fetch
- **Backend**: FastAPI, SQLModel, Alembic, PostgreSQL, JWT auth, APScheduler, SSE
- **AI**: Groq API (llama-3.3-70b-versatile)
- **Tooling**: Bun workspace, uv for Python, Turbo, oxlint, oxfmt

## Setup

Prereqs:

- Bun `>=1.3.1`
- Python `>=3.12`
- `uv`
- PostgreSQL

Install:

```bash
# 1. Install JS dependencies
bun install

# 2. Install Python dependencies
cd apps/api && uv sync && cd ../..

# 3. Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Minimum backend env (`apps/api/.env`):

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/sports
SECRET_KEY=change-me
FRONTEND_URL=http://localhost:3001
BACKEND_PUBLIC_URL=http://localhost:3000
TIMEZONE=America/Sao_Paulo
GROQ_API_KEY=gsk_...  # Optional - enables AI narratives and delegation generation
```

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
bun run dev:web        # Frontend only
bun run dev:backend    # Backend only
bun run check-types    # TypeScript check
bun run check          # Lint + format check
```

### API Type Generation

Frontend types are generated from the backend OpenAPI spec:

```bash
cd apps/web
bun run gen:types  # generates src/types/api.gen.ts from localhost:3000/openapi.json
```

Add to CI to detect schema drift:

```bash
bun run ci:api-types  # fails if backend spec differs from committed types
```

## Features

### Core

- **Multi-league management** - Create and manage multiple independent sports leagues
- **Delegation system** - Teams/delegations with chiefs, athletes, and coaches
- **Competition scheduling** - Automated bracket and schedule generation
- **Real-time results** - Match results with medal tracking and scoreboards
- **Transfer window** - Configurable athlete transfer periods
- **Activity feed** - Real-time match events and notifications via SSE

### AI-Powered Features

- **Daily Narratives** - AI-generated sports journalism narratives for each competition day
- **League Resume** - Executive summary of league standings and highlights
- **Delegation Generation** - "Gerar com IA" creates random delegations for demo data
- **Smart Population** - "Popular com IA" analyzes existing delegations and generates similar ones

All AI features use **Groq** (llama-3.3-70b-versatile).

## Frontend Architecture

Feature-based vertical slices:

```text
apps/web/src/
  routes/           # TanStack Router file-based routes
  features/         # domain vertical slices
    auth/
      api/queries.ts
      components/
      server/       # server functions
    leagues/
    athletes/
    delegations/
    narratives/     # AI narrative generation
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

Conventions:
- Use `@/` imports only; no relative `../`
- Feature-based organization: `features/{domain}/{api,components,server}/`
- Cross-cutting code lives in `shared/{components,lib,hooks}/`
- Reuse `packages/ui/src/components/` before building custom UI
- Share `queryOptions()` between loaders and `useSuspenseQuery`
- Never manually edit `routeTree.gen.ts`

## Backend Architecture

Domain-driven layers:

```text
apps/api/app/
  main.py           # composition root (wire routers, middleware)
  config.py         # Pydantic settings with env file
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
    delegations/
    narratives/     # AI integration service
    reports/
    ...
  shared/
    core/           # auth, security, limiter, scheduler, sse, deps
```

Layering: `router -> service -> repository -> domain model`

Conventions:
- Routers stay thin, services own business logic, repositories own DB access
- Use `background_tasks` for async side work
- Store timestamps in UTC; business logic uses `ZoneInfo(settings.TIMEZONE)`
- `ORJSONResponse` for app and exception handlers
- `slowapi` limiter via `app/shared/core/limiter.py`

## Auth And Roles

Current auth entrypoints:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/oauth/{provider}/start`

Current behavior:

- Password registration creates a user with global role `ATHLETE`
- OAuth login creates a user if missing
- League permissions are handled separately through `league_members`

Roles:

- **Global**: `SUPERADMIN`, `ADMIN`, `USER`, `ATHLETE`, `CHIEF`, `COACH`
- **League**: `LEAGUE_ADMIN`, `CHIEF`, `COACH`, `ATHLETE`

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

### Demo Data

League admins can generate demo data via dashboard:

- **Delegações** → "Gerar com IA" / "Popular com IA"
- **Atletas** → AI generation available
- **Modalidades** → AI generation available
- **Events** → AI generation available

## Environment Reference

### Backend (`apps/api/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SECRET_KEY` | Yes | JWT signing key (min 32 bytes recommended) |
| `FRONTEND_URL` | Yes | Frontend origin for CORS |
| `BACKEND_PUBLIC_URL` | Yes | Backend public URL |
| `TIMEZONE` | No | Business timezone (default: America/Sao_Paulo) |
| `GROQ_API_KEY` | No | Enables AI features (free tier at console.groq.com) |
| `GOOGLE_OAUTH_CLIENT_ID` | No | Google OAuth |
| `GITHUB_OAUTH_CLIENT_ID` | No | GitHub OAuth |
| `R2_*` | No | Cloudflare R2 for file storage |

### Frontend (`apps/web/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend URL |

## Important Notes

- Backend docs UI: `/docs` and `/redoc` only when `DEBUG=true`
- SSE must connect browser -> backend directly; do not proxy SSE through Workers
- Railway backend must run one `uvicorn` process only (multiple workers break SSE)
- Frontend types are generated from backend OpenAPI spec; run `gen:types` after schema changes
- Week auto-lock runs via APScheduler every 5 minutes after first event time passes
- `AUTO_SIMULATE=true` enables scheduler-driven auto-start/finish for matches
- `POST /admin/simulate/match/{id}` works regardless of `AUTO_SIMULATE`
- Transfer window is a pure service-layer time check in the configured business timezone
