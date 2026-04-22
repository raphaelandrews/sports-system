# Sports Competition System

A multi-sport competition management system designed for generic sporting events — school olympics, university tournaments, inter-club competitions. Delegations compete across sports over weekly competition cycles, with medal boards, athlete management, enrollment validation, and AI-powered content generation.

---

## Features

### Core
- **Delegation management** — create delegations with code, flag, chief, and member roster
- **Sports** — Football, Volleyball, Basketball, Athletics, Judo, Handball, Swimming, Beach Volleyball, Table Tennis, and Karate — each with sport-specific rules, statistics, and tiebreak criteria
- **Athlete & coach management** — linked to delegations and modalities, with full transfer history
- **Enrollment system** — per-event enrollment with automatic rule validation (weight category, gender, schedule conflicts, eligibility)
- **Competition calendar** — weekly schedule with phases (groups, knockout), venues, and match times
- **Live results & medal board** — real-time updates via SSE; in showcase mode (`AUTO_SIMULATE=true`) matches start and finish automatically with generated results, events, and statistics
- **Final report** — complete medal standings, per-sport classifications, records, and best marks
- **AI generation** — delegations, athletes, calendar, results, and daily narrative generated via LLM

### Competition Cycle
- Weekly format: 6 competition days (Tuesday–Sunday) + 1 transfer window (Monday)
- Transfer window opens **Monday 00:00** and closes **Tuesday 00:00** (UTC-3 / São Paulo) — automatic, no admin action required
- Calendar locks **automatically** when the first event's start time passes — match schedule is generated from approved enrollments at that moment
- New teams and athletes registered after lock-in are eligible from the next week
- Historical records always reflect the delegation a player represented **at the time of the match**

### Users
| Role | Access |
|------|--------|
| Admin | Full system control, AI generation, approve chief requests |
| Delegation Chief | Manage own delegation, invite members, submit enrollments |
| Coach / Manager | View delegation schedule and results |
| Athlete | View own schedule, results, and delegation history |
| Public | View medal board, calendar, and results (no auth required) |

- Users receive **in-app notifications** for invites, approvals, match reminders, and result updates
- Delegation transfers only on Mondays (transfer window)
- Chief access requires admin approval

---

## Tech Stack

### Frontend (`apps/web`)
| Technology | Role |
|---|---|
| [TanStack Start](https://tanstack.com/start) | Full-stack React framework, SSR + selective SPA |
| [TanStack Router](https://tanstack.com/router) | File-based routing, type-safe, auth guards |
| [TanStack Query](https://tanstack.com/query) | Server state, query caching for instant navigation |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com) + [@base-ui/react](https://base-ui.com) | Component library |
| [Cloudflare Workers](https://workers.cloudflare.com) | Edge deployment via [Alchemy](https://alchemy.run) |

### Backend (`apps/api`)
| Technology | Role |
|---|---|
| [FastAPI](https://fastapi.tiangolo.com) | Python REST API |
| [SQLModel](https://sqlmodel.tiangolo.com) | ORM (SQLAlchemy + Pydantic) |
| [Alembic](https://alembic.sqlalchemy.org) | Database migrations |
| PostgreSQL | Primary database + refresh token storage |
| JWT + FastAPI Users | Auth (access + refresh tokens, Argon2id hashing, OAuth-ready) |
| sse-starlette | Server-Sent Events — live scores, medal board streaming |
| slowapi | Rate limiting on auth endpoints (per IP) |
| orjson | High-performance JSON serialization |
| APScheduler | Automatic week locking, match generation, notifications |

---

## Project Structure

```
sports-system/
├── apps/
│   └── web/                    # TanStack Start frontend
│       ├── src/
│       │   ├── routes/         # File-based routes (TanStack Router)
│       │   │   ├── __root.tsx          # App shell + session loader
│       │   │   ├── index.tsx           # Landing page (SSR)
│       │   │   ├── login.tsx
│       │   │   ├── register.tsx
│       │   │   ├── (public)/           # Public SSR pages
│       │   │   └── _authenticated/     # Auth-guarded routes
│       │   │       ├── _admin/         # Admin-only routes
│       │   │       └── _chief/         # Chief/admin routes
│       │   ├── components/
│       │   │   ├── layout/     # Structural layout pieces
│       │   │   └── ui/         # Generic app-level UI primitives
│       │   ├── lib/
│       │   │   └── api.ts      # Typed FastAPI client
│       │   ├── queries/        # TanStack Query options + key factory per domain
│       │   ├── server/         # Server functions (createServerFn)
│       │   └── types/          # Shared TypeScript response types per domain
│       ├── vite.config.ts
│       └── package.json
│
├── packages/
│   ├── ui/                     # Shared shadcn/ui component library
│   ├── env/                    # Environment variable validation (t3-env)
│   └── config/                 # Shared TypeScript config
│
│   └── api/                    # FastAPI backend
│       ├── app/
│       │   ├── routers/        # Route handlers per domain
│       │   ├── services/       # Business logic
│       │   ├── repositories/   # Database queries
│       │   ├── models/         # SQLModel database models
│       │   └── schemas/        # Pydantic request/response schemas
│       └── alembic/            # Database migrations
│
├── FEATURES.md                 # Full feature spec (PT-BR) with phased tasks
├── turbo.json                  # Turborepo pipeline
└── package.json                # Workspace root (Bun)
```

---

## Prerequisites

- [Bun](https://bun.sh) >= 1.3.1
- [Python](https://python.org) >= 3.12
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- [Cloudflare account](https://dash.cloudflare.com) (for deployment)

---

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd sports-system

# Install all workspace dependencies
bun install
```

---

## Environment Variables

Each app has its own `.env.example` — copy and fill in the values:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/web/.env.production.example apps/web/.env.production  # prod URLs for deploy
cp packages/infra/.env.example packages/infra/.env            # only needed for deploy
```

| File | Used when | Variables |
|------|-----------|-----------|
| `apps/api/.env` | always | `DATABASE_URL`, `SECRET_KEY`, `FRONTEND_URL`, `PORT`, `TIMEZONE`, `AUTO_SIMULATE`, `LLM_API_KEY` |
| `apps/web/.env` | dev | `VITE_SERVER_URL` (localhost), `VITE_TIMEZONE`, `CORS_ORIGIN` (localhost) |
| `apps/web/.env.production` | deploy (`NODE_ENV=production`) | `VITE_SERVER_URL` (Railway), `CORS_ORIGIN` (Workers domain) |
| `packages/infra/.env` | deploy | `ALCHEMY_PASSWORD`, `CLOUDFLARE_API_TOKEN` |

---

## Development

```bash
# Start everything (frontend + backend + infra watcher)
bun dev

# Start frontend only
bun run dev:web

# Start backend only (port 3000)
bun run dev:backend

# Type checking across all packages
bun run check-types

# Lint + format
bun run check
```

Frontend: `http://localhost:3001` · Backend: `http://localhost:3000` · Swagger UI: `http://localhost:3000/docs` · ReDoc: `http://localhost:3000/redoc`

> Swagger UI and ReDoc are only served when `DEBUG=true` (default in dev). Set `DEBUG=false` in production env vars to disable.

> `bun dev` requires Cloudflare credentials (`CLOUDFLARE_API_TOKEN`) for the infra watcher. Use `bun run dev:web` + `bun run dev:backend` without them.

**First-time setup:**
```bash
# JS dependencies
bun install

# Backend dependencies
cd apps/api && uv sync

# Environment variables
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — at minimum set DATABASE_URL, SECRET_KEY, FRONTEND_URL
cp apps/web/.env.example apps/web/.env

# Run database migrations
bun run db:up
```

---

## Deployment

Deploys to Cloudflare Workers via Alchemy:

```bash
# Deploy frontend
bun run deploy

# Destroy deployed resources
bun run destroy
```

Infra config: `packages/infra/alchemy.run.ts`. `bun run deploy` sets `NODE_ENV=production` → `alchemy.run.ts` loads `apps/web/.env.production` (Railway URLs). In dev, no `NODE_ENV` → loads `apps/web/.env` (localhost URLs). `packages/infra/.env` only needs `ALCHEMY_PASSWORD` and `CLOUDFLARE_API_TOKEN`.

---

## Scripts Reference

| Script | Description |
|--------|-------------|
| `bun dev` | Start frontend + backend + infra watcher |
| `bun run dev:web` | Start frontend only |
| `bun run dev:backend` | Start FastAPI backend only |
| `bun run build` | Build all apps |
| `bun run check-types` | TypeScript check across workspace |
| `bun run check` | Lint (oxlint) + format (oxfmt) |
| `bun run deploy` | Deploy to Cloudflare Workers |
| `bun run destroy` | Destroy Cloudflare resources |
| `bun run db:up` | Run database migrations (upgrade head) |
| `bun run db:new "msg"` | Create new migration with autogenerate |
| `bun run db:down` | Roll back last migration |
| `bun run --cwd apps/web gen:types` | Regenerate frontend types from OpenAPI schema |

---

## API Types

Frontend types in `apps/web/src/types/` are generated from the FastAPI OpenAPI schema. The source of truth is `apps/web/src/types/api.gen.ts` — never edit it manually.

**Regenerate after changing a Pydantic schema:**

```bash
# Backend must be running on localhost:3000
bun run dev:backend   # in one terminal

# In another terminal
bun run --cwd apps/web gen:types
```

All domain type files (`weeks.ts`, `athletes.ts`, etc.) re-export from `api.gen.ts`, so existing imports throughout the codebase remain unchanged after regeneration.

**Using the types:**

```ts
import type { WeekResponse, WeekStatus } from "@/types/weeks";

// or directly from the generated file:
import type { ApiSchemas } from "@/types/api.gen";
type WeekResponse = ApiSchemas["WeekResponse"];
```

---

## UI Customization

Shared UI primitives live in `packages/ui`. Add new shadcn components:

```bash
# From project root — adds to shared UI package
npx shadcn@latest add table dialog sheet -c packages/ui
```

Import shared components:

```tsx
import { Button } from "@sports-system/ui/components/button";
```

---

## Sports Supported

| Sport | Type | Players |
|-------|------|---------|
| Football (Futebol) | Team | 11 |
| Volleyball (Vôlei) | Team | 6 |
| Basketball (Basquete) | Team | 5 |
| Athletics (Atletismo) | Individual / Relay | 1–4 |
| Judo (Judô) | Individual | 1 |
| Handball (Handebol) | Team | 7 |
| Swimming (Natação) | Individual / Relay | 1–4 |
| Beach Volleyball (Vôlei de Praia) | Team | 2 |
| Table Tennis (Tênis de Mesa) | Individual / Doubles | 1–2 |
| Karate (Karatê) | Individual | 1 |

Each sport has custom statistics, tiebreak rules, and competition phases. See [FEATURES.md](./FEATURES.md) for full rules.

