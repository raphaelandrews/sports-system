# Sports System — Claude Instructions

## Project
Multi-sport competition management system. Delegations compete across 10 sports in weekly cycles. Features medal boards, athlete management, enrollment validation, AI content generation.

Full spec: `FEATURES.md` | Phased task list: `FEATURES.md` (backend phases 1–10, frontend phases 1–14)

## Monorepo Structure
```
apps/web/     TanStack Start frontend       → port 3001
apps/api/     FastAPI backend               → port 3000
packages/ui/        shared shadcn/ui components
packages/env/       env validation (t3-env + zod)
packages/config/    shared TypeScript config
packages/infra/     Cloudflare deploy via Alchemy
```

## Package Managers
- **JS**: `bun` — never use npm or yarn
- **Python**: `uv` — never use pip directly

## Dev Commands
```bash
bun dev              # frontend + backend + infra watcher (concurrently)
bun run dev:web      # frontend only (no Cloudflare creds needed)
bun run dev:backend  # FastAPI only
bun run check-types  # TypeScript across workspace
bun run check        # oxlint + oxfmt
bun run db:up        # run migrations (upgrade head)
bun run db:new "msg" # new autogenerate migration
bun run db:down      # rollback one migration
```

First-time backend setup: `cd apps/api && uv sync && bun run db:up`

## Tech Stack

### Frontend (`apps/web`)
- TanStack Start (React 19, SSR + selective SPA)
- TanStack Router — file-based routing, `beforeLoad` guards
- TanStack Query — server state, `queryOptions()` shared between loader + hook
- Tailwind CSS v4 + shadcn/ui (`packages/ui`)
- Cloudflare Workers deploy via Alchemy

### Backend (`apps/api`)
- FastAPI + pydantic-settings
- Layer order: `router → service → repository → model`
- SQLModel + Alembic — configured; `apps/api/alembic/` has migrations at head
- PostgreSQL (refresh tokens table for JWT invalidation; SSE via asyncio.Queue)
- JWT auth — custom access + refresh tokens; FastAPI Users for user management (Argon2id hashing via pwdlib), OAuth-ready via `app/core/auth.py`
- APScheduler: auto-lock weeks, auto-generate matches, 24h match notifications
- SSE via `sse-starlette` — `EventSourceResponse(generator, ping=20)`, no manual heartbeat needed
- slowapi rate limiting — `app/core/limiter.py` singleton; apply with `@limiter.limit("N/minute")` + `request: Request` as first param
- orjson — `default_response_class=ORJSONResponse` on the app; all exception handlers return `ORJSONResponse`
- All timestamps stored UTC; business logic uses `ZoneInfo(settings.TIMEZONE)`

## Code Style
- **No comments** unless the logic is genuinely non-obvious. Self-explanatory code needs no explanation.
- No over-engineering — solve only what is asked, no extra abstractions or "future-proofing"
- No backwards-compat shims, unused exports, or placeholder stubs
- Prefer editing existing files over creating new ones
- TypeScript: strict, no `any`
- Python: type hints everywhere, Pydantic v2 for all schemas

## Timezone Pattern
- DB: store UTC always
- Backend logic: `from zoneinfo import ZoneInfo` + `datetime.now(ZoneInfo(settings.TIMEZONE))`
- Transfer window check: `datetime.now(ZoneInfo(settings.TIMEZONE)).weekday() == 0`
- API responses: ISO 8601 with offset (`2025-01-06T09:00:00-03:00`)
- Frontend: `formatEventDate(iso)` in `apps/web/src/lib/date.ts` — uses browser timezone (viewer's local time)
- API responses include offset (`-03:00`) so browser can convert correctly to viewer's local time

## Automation Patterns
- Transfer window: pure time check in service layer, no admin action, no state change
- Week auto-lock: APScheduler every 5min — `first_event.start_time < utcnow()` → lock + trigger bracket/schedule generation
- Match generation: `bracket_service` (pairings) + `schedule_service` (time slots) — called at lock time
- Match auto-simulation (`AUTO_SIMULATE=true`): APScheduler every 1min — auto-start matches at scheduled time, auto-finish + generate results after 5min
- `simulation_service`: generates realistic scores, `match_events`, `athlete_statistics` per sport — no LLM needed, uses sport-specific value ranges
- `POST /admin/simulate/match/{id}`: manual trigger for any match regardless of `AUTO_SIMULATE`
- Enrollment validation: generic engine reads `modality.rules_json`, no per-sport hardcoding

## Library-First Rule
- **TanStack**: if a TanStack lib covers the use case (routing, data fetching, forms, tables, virtualizing lists), use it — don't reach for a third-party alternative
- **shadcn/ui**: if a component exists in `packages/ui/src/components/`, use it — don't build a duplicate from scratch. Add missing shadcn components to the shared package before creating custom ones
- **TanStack Devtools** (dev-only, all wired in `__root.tsx`):
  - Router → `TanStackRouterDevtools` (bottom-left) ✓
  - Query → `ReactQueryDevtools` (bottom-right) ✓
  - Form → `@tanstack/react-form-devtools` installed; wire per-form when building form pages

## Frontend Patterns
- `queryOptions()` factory shared between route loader and `useSuspenseQuery`
- `staleTime` by data type: lists 2min, medal board 30s, AI responses 10min
- Route guards: `_authenticated.tsx` → `_admin.tsx` / `_chief.tsx` via `beforeLoad`
- SSR strategy per route: public pages full SSR, auth pages `data-only`, live/AI pages `ssr: false`
- Shared UI components live in `packages/ui`, import as `@sports-system/ui/components/...`
- All imports within `apps/web/src/` must use the `@/` alias (e.g. `@/lib/api`, `@/queries/weeks`) — no relative `../` paths. Exception: auto-generated `routeTree.gen.ts` (never edit manually)
- `routeTree.gen.ts` is **auto-generated** by `@tanstack/router-plugin` on `vite dev` startup — never edit manually, never commit stale version
- Route group folders `(public)/` are filesystem-only organization — no layout file needed or supported in this router version

## Deployment
- Railway (backend): single uvicorn process — no `--workers` flag. `asyncio.Queue` is per-process; multiple workers = SSE clients miss events
- Cloudflare Workers (frontend): SSE goes browser → Railway directly, never through Workers (CPU time limits)
- `FRONTEND_URL` Railway env var = Cloudflare Workers domain → CORS middleware picks it up automatically

## Backend Patterns
- One router file per domain (e.g. `routers/delegations.py`)
- Services own business logic — routers stay thin
- Repositories own DB queries — services don't touch SQLModel directly
- Pydantic schemas in `schemas/` separate from SQLModel models in `models/`
- `background_tasks` for async ops (AI generation, notifications)

## Environment
- Each app has its own `.env.example`: `apps/api/.env.example`, `apps/web/.env.example`, `packages/infra/.env.example`
- Key vars: `TIMEZONE=America/Sao_Paulo` (api)
- `packages/infra/.env` only needed for `bun run deploy` — contains `ALCHEMY_PASSWORD` and `CLOUDFLARE_API_TOKEN`
- `apps/web/.env` — dev URLs (`VITE_SERVER_URL=http://localhost:3000`, `CORS_ORIGIN=http://localhost:3001`)
- `apps/web/.env.production` — prod URLs (Railway API, Cloudflare Workers domain); loaded automatically by `alchemy.run.ts` when `NODE_ENV=production`
- `bun run deploy` sets `NODE_ENV=production` — no manual env switching needed
