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
- SQLModel + Alembic — configured; `apps/api/alembic/` has initial migration at head
- PostgreSQL (refresh tokens table for JWT invalidation; SSE via asyncio.Queue)
- JWT auth (coming in phase 2)
- APScheduler: auto-lock weeks, auto-generate matches, 24h match notifications
- SSE only for real-time (no WebSocket) — `StreamingResponse` / `EventSourceResponse`
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
- Frontend: `formatEventDate(iso)` in `apps/web/src/lib/date.ts` — always uses `VITE_TIMEZONE`, never `Date.toLocaleDateString()` without timezone
- Never use user's browser timezone for event times — all times are event-local (São Paulo)

## Automation Patterns
- Transfer window: pure time check in service layer, no admin action, no state change
- Week auto-lock: APScheduler every 5min — `first_event.start_time < utcnow()` → lock + trigger bracket/schedule generation
- Match generation: `bracket_service` (pairings) + `schedule_service` (time slots) — called at lock time
- Match auto-simulation (`AUTO_SIMULATE=true`): APScheduler every 1min — auto-start matches at scheduled time, auto-finish + generate results after 5min
- `simulation_service`: generates realistic scores, `match_events`, `athlete_statistics` per sport — no LLM needed, uses sport-specific value ranges
- `POST /admin/simulate/match/{id}`: manual trigger for any match regardless of `AUTO_SIMULATE`
- Enrollment validation: generic engine reads `modality.rules_json`, no per-sport hardcoding

## Frontend Patterns
- `queryOptions()` factory shared between route loader and `useSuspenseQuery`
- `staleTime` by data type: lists 2min, medal board 30s, AI responses 10min
- Route guards: `_authenticated.tsx` → `_admin.tsx` / `_chief.tsx` via `beforeLoad`
- SSR strategy per route: public pages full SSR, auth pages `data-only`, live/AI pages `ssr: false`
- Shared UI components live in `packages/ui`, import as `@sports-system/ui/components/...`

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
- Each app has its own `.env.example`
- Key vars: `TIMEZONE=America/Sao_Paulo` (api), `VITE_TIMEZONE=America/Sao_Paulo` (web)
- `packages/infra/.env` only needed for `bun run deploy`
