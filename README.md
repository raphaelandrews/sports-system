# Sports System

Multi-league sports competition platform.

- `apps/web`: TanStack Start frontend on `http://localhost:3001`
- `apps/api`: FastAPI backend on `http://localhost:3000`
- `packages/ui`: shared shadcn/ui components
- `packages/env`: shared env validation
- `packages/config`: shared TS config
- `packages/infra`: Cloudflare/Alchemy deploy code

## Stack

- Frontend: TanStack Start, TanStack Router, TanStack Query, Tailwind v4, shadcn/ui
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

## Auth And Roles

Current auth entrypoints:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/oauth/{provider}/start`

Current behavior:

- Password registration creates a user with global role `ATHLETE`
- OAuth login creates a user if missing
- League permissions are handled separately through `league_members`
- Showcase seeding requires an existing global `SUPERADMIN` or legacy `ADMIN`

No API currently promotes a user to `SUPERADMIN`. First superadmin bootstrap is manual in the database.

## Seeds

Startup flow in [`apps/api/app/main.py`](/home/raphael/Documents/projects/sports-system/apps/api/app/main.py:67):

1. Alembic runs on app startup
2. `seed_sports()` inserts canonical sports/modalities once
3. `seed_showcase_league()` creates the showcase league if a superadmin already exists

Detailed seed docs: [`SEED.md`](/home/raphael/Documents/projects/sports-system/SEED.md)

### First Superadmin

Recommended bootstrap:

1. Start API once so migrations and `seed_sports()` run
2. Register an account in UI or via API
3. Promote that row in the database
4. Restart API so `seed_showcase_league()` can create the showcase league

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

Then restart backend:

```bash
bun run dev:backend
```

On next startup the backend will create:

- showcase league with `slug="showcase"`
- `LeagueMember` entry for that superadmin as `LEAGUE_ADMIN`
- `sports_config` containing all active sports
- `auto_simulate=true`
- `transfer_window_enabled=true`

### Manual Demo Seed

Endpoint:

- `POST /leagues/{league_id}/admin/seed`

Behavior:

- requires league admin membership
- creates 4 demo delegations
- creates demo chiefs and athletes
- creates one completed competition and sample results
- returns `409` if that league already has delegations

## Notes

- Backend docs UI: `/docs` and `/redoc` only when `DEBUG=true`
- SSE must connect browser -> backend directly; do not proxy SSE through Workers
- Railway backend must run one `uvicorn` process only
