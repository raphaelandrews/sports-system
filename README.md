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
- **Live results & medal board** — real-time updates as results are entered
- **Final report** — complete medal standings, per-sport classifications, records, and best marks
- **AI generation** — delegations, athletes, calendar, results, and daily narrative generated via LLM

### Competition Cycle
- Weekly format: 6 competition days (Tuesday–Sunday) + 1 transfer window (Monday)
- Calendar is locked before the first event starts — no schedule changes mid-week
- New teams and athletes registered after the lock-in are eligible from the next week
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

### Backend (`backend/` — coming soon)
| Technology | Role |
|---|---|
| [FastAPI](https://fastapi.tiangolo.com) | Python REST API |
| [SQLModel](https://sqlmodel.tiangolo.com) | ORM (SQLAlchemy + Pydantic) |
| [Alembic](https://alembic.sqlalchemy.org) | Database migrations |
| PostgreSQL | Primary database |
| Redis | Cache + pub/sub for real-time updates |
| JWT | Authentication (access + refresh tokens) |
| WebSocket / SSE | Live score updates |

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
│       │   ├── components/     # Shared UI components
│       │   ├── lib/
│       │   │   ├── api.ts      # Typed FastAPI client
│       │   │   └── queryKeys.ts
│       │   └── queries/        # TanStack Query hooks per domain
│       ├── vite.config.ts
│       └── package.json
│
├── packages/
│   ├── ui/                     # Shared shadcn/ui component library
│   ├── env/                    # Environment variable validation (t3-env)
│   └── config/                 # Shared TypeScript config
│
├── backend/                    # FastAPI backend (coming soon)
│   ├── app/
│   │   ├── routers/            # Route handlers per domain
│   │   ├── services/           # Business logic
│   │   ├── repositories/       # Database queries
│   │   ├── models/             # SQLModel database models
│   │   └── schemas/            # Pydantic request/response schemas
│   └── alembic/                # Database migrations
│
├── FEATURES.md                 # Full feature spec (PT-BR) with phased tasks
├── turbo.json                  # Turborepo pipeline
└── package.json                # Workspace root (Bun)
```

---

## Prerequisites

- [Bun](https://bun.sh) >= 1.3.1
- [Python](https://python.org) >= 3.12 (for backend — when added)
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

### `apps/web/.env`
```env
VITE_SERVER_URL=http://localhost:3000   # FastAPI backend URL
CORS_ORIGIN=http://localhost:3001       # Frontend URL (for backend CORS)
```

### `packages/infra/.env`
```env
ALCHEMY_PASSWORD=your-password          # Alchemy state encryption
CLOUDFLARE_API_TOKEN=your-cf-token      # Cloudflare deployment token
```

### `backend/.env` (when added)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/sports
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-jwt-secret
LLM_API_KEY=your-llm-api-key
FRONTEND_URL=http://localhost:3001
```

---

## Development

```bash
# Start frontend (no Cloudflare Workers — faster for dev)
bun run dev:web

# Start full stack with infra watcher
# Requires Cloudflare credentials in packages/infra/.env
bun run dev

# Type checking across all packages
bun run check-types

# Lint + format
bun run check
```

Frontend runs at `http://localhost:3001`.

> **Backend not yet implemented.** The frontend connects to `VITE_SERVER_URL`. All API calls fail gracefully until the FastAPI server is running.

### Backend dev (port 3000) — coming soon
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 3000
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

Infra config: `packages/infra/alchemy.run.ts`. Reads `VITE_SERVER_URL` and `CORS_ORIGIN` from env files.

---

## Scripts Reference

| Script | Description |
|--------|-------------|
| `bun run dev` | Start all apps (Turbo) |
| `bun run dev:web` | Start frontend only |
| `bun run build` | Build all apps |
| `bun run check-types` | TypeScript check across workspace |
| `bun run check` | Lint (oxlint) + format (oxfmt) |
| `bun run deploy` | Deploy to Cloudflare Workers |
| `bun run destroy` | Destroy Cloudflare resources |

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

---

