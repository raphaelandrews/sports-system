# Multi-League Rework Plan

## Context

The system currently operates as a single global competition driven by one implicit ADMIN. The goal is to introduce a first-class `League` entity so that:

- The platform owner (superadmin) runs a showcase league with full automation
- Any registered user can create their own league and become its admin
- Leagues are fully isolated: own competitions, delegations, athletes, events, results
- Sports are global (superadmin-managed), leagues select which of the 10 to use
- Users can participate in multiple leagues with independent per-league roles
- `CompetitionWeek` is renamed to `Competition` — more generic, not locked to a 7-day cycle
- Transfer window (Monday rule) is a per-league opt-in (`transfer_window_enabled`), only showcase uses it

---

## Architecture Decisions

| Decision                     | Choice                      | Reason                                             |
| ---------------------------- | --------------------------- | -------------------------------------------------- |
| Multi-league roles           | `league_members` table      | User can be CHIEF in League A, ATHLETE in League B |
| URL structure                | Nested `/leagues/{lid}/...` | Bookmarkable, clean REST, league always in URL     |
| Sports availability          | Global only (all 10)        | League selects subset; no per-league custom sports |
| `CompetitionWeek` name       | Renamed to `Competition`    | Weekly framing is showcase-specific, not universal |
| Transfer window              | Per-league flag             | Only showcase league needs Monday enforcement      |
| User global roles            | `SUPERADMIN` / `USER`       | Per-league roles move entirely to `league_members` |
| Multiple active competitions | Allowed                     | Manual leagues may run parallel competitions       |

---

## New Data Model

### `leagues` table

```python
class League(SQLModel, table=True):
    id: int
    name: str
    slug: str          # unique, URL-safe
    description: str | None
    created_by_id: int  # FK: users.id
    sports_config: list[int]  # JSON — selected sport IDs
    is_showcase: bool = False
    auto_simulate: bool = False
    transfer_window_enabled: bool = False
    timezone: str = "America/Sao_Paulo"
    status: LeagueStatus  # ACTIVE / ARCHIVED
    created_at: datetime
```

### `league_members` table

```python
class LeagueMember(SQLModel, table=True):
    id: int
    league_id: int  # FK: leagues.id
    user_id: int    # FK: users.id
    role: LeagueMemberRole  # LEAGUE_ADMIN / CHIEF / COACH / ATHLETE
    joined_at: datetime
    left_at: datetime | None
```

### Tables gaining `league_id` FK

| Table                                    | Note                                                         |
| ---------------------------------------- | ------------------------------------------------------------ |
| `competitions` (was `competition_weeks`) | Top of event hierarchy                                       |
| `delegations`                            | Top of member hierarchy                                      |
| `athletes`                               | Per-league profiles; same user → multiple league profiles OK |
| `chief_requests`                         | Approved by league admin within their league                 |
| `narratives`                             | One daily narrative per league                               |
| `ai_generations`                         | Track AI usage per league                                    |

### `UserRole` change

- Old: `ADMIN`, `CHIEF`, `COACH`, `ATHLETE`
- New: `SUPERADMIN`, `USER`
- JWT `role` claim = platform level only; per-league role requires `league_members` lookup

---

## Phase 0 — Rename CompetitionWeek → Competition

**Goal:** Clean rename before any other work. All downstream references update at once.

### Backend

- [x] Rename `app/models/week.py` → `app/models/competition.py`
- [x] Rename class `CompetitionWeek` → `Competition`, table `competition_weeks` → `competitions`
- [x] Rename field `week_number` → `number`; `start_date`/`end_date` unchanged
- [x] Update all imports: models, schemas, services, repositories, routers
- [x] Rename `app/schemas/week.py` → `app/schemas/competition.py`; update schema class names
- [x] Rename `app/services/week_service.py` → `app/services/competition_service.py`
- [x] Rename `app/repositories/week_repository.py` → `app/repositories/competition_repository.py`
- [x] Rename `app/routers/weeks.py` → `app/routers/competitions.py`; update prefix `/weeks` → `/competitions`
- [x] Create Alembic migration: rename table + column
- [x] Update `main.py` to register renamed router

### Frontend

- [x] Rename `src/queries/weeks.ts` → `src/queries/competitions.ts`; update all references
- [x] Rename route files: `weeks/` → `competitions/` across all route directories
- [x] Update `src/queries/keys.ts`: `weeks` → `competitions`
- [x] Update all component imports and type references
- [x] Regenerate `src/types/api.gen.ts`

---

## Phase 1 — Backend: New Data Model & Migrations

**Goal:** Add League and LeagueMember models; migrate existing data; rework UserRole.

### 1.1 New models

- [x] Create `app/models/league.py`:
  - `LeagueStatus` enum: `ACTIVE`, `ARCHIVED`
  - `LeagueMemberRole` enum: `LEAGUE_ADMIN`, `CHIEF`, `COACH`, `ATHLETE`
  - `League` SQLModel with all fields above
  - `LeagueMember` SQLModel with all fields above
- [x] Add to `app/models/__init__.py`

### 1.2 Update existing models

- [x] `app/models/competition.py`: add `league_id: int = Field(foreign_key="leagues.id")`
- [x] `app/models/delegation.py`: add `league_id: int = Field(foreign_key="leagues.id")`
- [x] `app/models/athlete.py`: add `league_id: int = Field(foreign_key="leagues.id")`
- [x] `app/models/user.py`: add `SUPERADMIN`, `USER` to `UserRole` enum; keep old values in DB (Postgres limitation)
- [x] `app/models/narrative.py`: add `league_id: int | None` to both `Narrative` and `AIGeneration`
- [x] `ChiefRequest` model: add `league_id: int`

### 1.3 Alembic migrations (3 files)

**Migration A — `add_leagues_and_league_members`**

- [x] Create `leagues` table
- [x] Create `league_members` table (composite unique on `league_id + user_id` where `left_at IS NULL`)

**Migration B — `add_league_id_to_scoped_tables`**

- [x] Add nullable `league_id` to: `competitions`, `delegations`, `athletes`, `chief_requests`, `narratives`, `ai_generations`
- [x] Insert showcase league row (`is_showcase=True`, `auto_simulate=True`, `transfer_window_enabled=True`, all 10 sports)
- [x] Backfill `league_id = <showcase_id>` on all existing rows
- [x] Make `league_id` NOT NULL on `competitions`, `delegations`, `athletes`, `chief_requests`
- [x] Migrate existing `delegation_members` CHIEF/COACH/ATHLETE entries → `league_members` for showcase league

**Migration C — `rework_user_roles`**

- [x] Add `SUPERADMIN`, `USER` to `userrole` enum
- [x] `UPDATE users SET role='SUPERADMIN' WHERE role='ADMIN'`
- [x] `UPDATE users SET role='USER' WHERE role IN ('CHIEF', 'COACH', 'ATHLETE')`

### 1.4 New schemas (`app/schemas/league.py`)

- [x] `LeagueCreate`, `LeagueUpdate`, `LeagueResponse` (+ `member_count`)
- [x] `LeagueMemberResponse`, `LeagueMemberRoleUpdate`

---

## Phase 2 — Backend: League Service, Repository & Router

**Goal:** Full CRUD for leagues + membership management.

### 2.1 Repository (`app/repositories/league_repository.py`)

- [x] `get_all`, `get_by_id`, `get_by_slug`, `create`, `update`
- [x] `get_member`, `get_members`, `add_member`, `update_member_role`, `remove_member`
- [x] `get_leagues_for_user`, `get_active_leagues`

### 2.2 Service (`app/services/league_service.py`)

- [x] `create_league` → creates League + adds creator as LEAGUE_ADMIN in league_members
- [x] `update_league`, `archive_league`, `get_league_or_404`
- [x] `get_member_or_403`, `require_league_admin`
- [x] `add_member`, `update_member_role`, `remove_member`
- [x] `get_leagues_for_user`

### 2.3 Auth deps (`app/core/deps.py`)

- [x] Rename `require_admin` → `require_superadmin` (checks `SUPERADMIN` or legacy `ADMIN`)
- [x] Add `get_league_member(league_id)` factory (DB lookup, raises 403 if not found)
- [x] Add `require_league_admin`, `require_league_chief`, `require_league_member` dep factories

### 2.4 Router (`app/routers/leagues.py`, prefix: `/leagues`)

- [x] `GET /leagues` — list public leagues
- [x] `POST /leagues` — create (authenticated)
- [x] `GET /leagues/{league_id}` — detail (public)
- [x] `PATCH /leagues/{league_id}` — edit (league admin)
- [x] `DELETE /leagues/{league_id}` — archive (league admin or superadmin)
- [x] `GET /leagues/{league_id}/members` — list (any member)
- [x] `GET /leagues/{league_id}/members/me` — my membership (authenticated)
- [x] `PATCH /leagues/{league_id}/members/{user_id}` — update role (league admin)
- [x] `DELETE /leagues/{league_id}/members/{user_id}` — remove (league admin or self)
- [x] `GET /leagues/my` — user's leagues (authenticated)
- [x] Register in `main.py`

---

## Phase 3 — Backend: Scope All Routes to League

**Goal:** Every domain router gains `/leagues/{league_id}` prefix; services filter by `league_id`.

### Router prefix changes

| Router            | New prefix                          |
| ----------------- | ----------------------------------- |
| `competitions.py` | `/leagues/{league_id}/competitions` |
| `delegations.py`  | `/leagues/{league_id}/delegations`  |
| `athletes.py`     | `/leagues/{league_id}/athletes`     |
| `events.py`       | `/leagues/{league_id}/events`       |
| `enrollments.py`  | `/leagues/{league_id}/enrollments`  |
| `results.py`      | `/leagues/{league_id}/results`      |
| `reports.py`      | `/leagues/{league_id}/report`       |
| `narratives.py`   | `/leagues/{league_id}/narrative`    |
| `admin.py`        | `/leagues/{league_id}/admin`        |

Matches routes (`/matches/{id}/*`) stay global — league inferred via FK chain.

### Auth changes per router

- Replace `require_admin` → `require_league_admin(league_id)` for write ops
- Replace `require_chief_or_admin` → `require_league_chief(league_id)`
- Public reads: no auth, but responses scoped to league

### Service updates (all gain `league_id` param)

- [x] `competition_service.py`, `delegation_service.py`, `athlete_service.py`
- [x] `enrollment_service.py`, `result_service.py`, `simulation_service.py`
- [x] `report_service.py`, `narrative_service.py`, `search_service.py`, `activity_service.py`
- [x] `delegation_service.py`: transfer window check reads `league.transfer_window_enabled`
- [x] `simulation_service.py`: SSE broadcast scoped to league channel

### Repository updates

- [ ] All repositories filter queries by `league_id`

---

## Phase 4 — Backend: Automation & Seeding

**Goal:** APScheduler iterates over all leagues; showcase league auto-created on startup.

### APScheduler

- [x] All jobs iterate `league_repo.get_active_leagues()`
- [x] Auto-simulate jobs only run for leagues where `auto_simulate=True`
- [x] Transfer window only enforced for `transfer_window_enabled=True`

### Seed service

- [x] Keep `seed_sports()` (global, runs once)
- [x] Add `seed_showcase_league()`: idempotent, creates showcase League + superadmin as creator
- [x] Call both in `main.py` lifespan

### Demo seed endpoint

- [x] `POST /leagues/{league_id}/admin/seed` — seeds specified league with demo data (idempotent)

---

## Phase 5 — Frontend: New Route Tree

**Goal:** All pages move under `/leagues/$leagueId/`.

### New structure

```
src/routes/
  index.tsx                              — leagues landing (SSR)
  leagues/
    index.tsx                            — full leagues list (SSR)
    new.tsx                              — create league (authenticated)
    $leagueId/
      __layout.tsx                       — league context provider
      (public)/
        results/index.tsx
        results/records/index.tsx
        results/sports/$sportId/index.tsx
        calendar/index.tsx
        calendar/$competitionId/index.tsx
        delegations/index.tsx
        delegations/$delegationId.tsx
        sports/index.tsx
        sports/$sportId.tsx
        sports/$sportId/bracket.tsx
        report/index.tsx
        feed/index.tsx
      _authenticated/
        _league_admin/
          competitions/{index,new,$competitionId/index}.tsx
          calendar/events/new.tsx
          delegations/{new,$delegationId/index,$delegationId/edit}.tsx
          athletes/{index,new}.tsx
          enrollments/index.tsx
          ai/index.tsx
          settings/index.tsx
        _chief/
          my-delegation/{index,invite,members,transfers}.tsx
        dashboard/
          index.tsx
          results/index.tsx
          calendar/index.tsx
          athletes/{index,new}.tsx
          competitions/index.tsx
          enrollments/{index,new}.tsx
          search.tsx
        athletes/$athleteId.tsx
        athletes/compare.tsx
        matches/$matchId/index.tsx
        narrative/index.tsx
  _authenticated/
    my-leagues/index.tsx                 — user's leagues (outside league prefix)
    request-chief.tsx                    — (now league-scoped in spirit)
```

### League layout (`$leagueId/__layout.tsx`)

- [x] `loader`: fetch league detail, inject into route context
- [x] `errorComponent`: "League not found"

### Auth guard updates

- [x] `_admin.tsx` → `_superadmin.tsx`: check `session.role === "SUPERADMIN"`
- [x] `_league_admin.tsx` (new): fetch `/leagues/{lid}/members/me`, check `LEAGUE_ADMIN`
- [x] `_chief.tsx`: check league membership `role in ["LEAGUE_ADMIN", "CHIEF"]`

### Move existing routes

- [x] All `(public)/` → `leagues/$leagueId/(public)/`
- [x] All `_authenticated/dashboard/` → `leagues/$leagueId/_authenticated/dashboard/`
- [x] `_authenticated/_admin/` → `leagues/$leagueId/_authenticated/_league_admin/`
- [x] `_authenticated/_chief/` → `leagues/$leagueId/_authenticated/_chief/`
- [x] Update all `Link`/`navigate` calls to include `leagueId`

---

## Phase 6 — Frontend: Queries, Types & API Client

**Goal:** All data fetching updated to league-scoped endpoints.

### Type regeneration

- [x] `bun run dev:backend` (backend must be running)
- [x] `bun run --cwd apps/web gen:types`

### Query key factory (`src/queries/keys.ts`)

- [x] All domain factories gain `leagueId` as first param
- [x] Add `leagues` factory (no prefix)

### Query files to update

- [x] NEW: `src/queries/leagues.ts`
- [x] `competitions.ts` (was `weeks.ts`): add `leagueId`, URL `/leagues/${lid}/competitions`
- [x] `delegations.ts`, `athletes.ts`, `events.ts`, `enrollments.ts`, `results.ts`, `reports.ts`, `ai.ts`: same pattern
- [x] `activities.ts`, `search.ts`: add optional `leagueId`

### Mutation calls

- [x] All `apiFetch` POSTs/PATCHes/DELETEs in league-scoped pages gain `/leagues/${leagueId}` prefix

---

## Phase 7 — Frontend: New Pages & UI

### Landing page (`src/routes/index.tsx`)

- [x] Fetch all leagues, show grid: name, sports count, member count, status
- [x] Showcase league pinned with "Live" badge
- [x] "Create your league" CTA (authenticated only)
- [x] SSR

### Create league page (`src/routes/leagues/new.tsx`)

- [x] Fields: name, slug (auto from name), description, timezone
- [x] Sport checkboxes (10 options, min 1)
- [x] Toggle: transfer window, auto-simulate
- [x] Submit → redirect to `/leagues/{id}/dashboard`

### League settings (`leagues/$leagueId/_authenticated/_league_admin/settings/index.tsx`)

- [x] Edit league config, sports selection, danger zone (archive)
- [x] Member list with role management

### League dashboard (`leagues/$leagueId/_authenticated/dashboard/index.tsx`)

- [x] LEAGUE_ADMIN: active competitions, pending requests, member count, AI shortcuts
- [x] CHIEF: delegation overview, upcoming matches
- [x] ATHLETE/COACH: upcoming matches, recent results
- [x] `ssr: 'data-only'`

### My leagues page (`_authenticated/my-leagues/index.tsx`)

- [x] User's leagues list with role per league
- [x] Quick links + "Create new league"

---

## Phase 8 — Cleanup & Verification

- [x] Remove old root-level public and dashboard routes
- [x] Update `NotificationBell` / `Header` hardcoded links
- [x] Notification payload gains `league_id`; links resolve to `/leagues/{lid}/...`
- [ ] `bun run check-types` — zero errors (skipped: no builds)
- [ ] `bun run check` — zero lint/format errors (skipped: no builds)

### End-to-end checklist

```bash
bun run dev:backend
# ✓ Sports seeded, showcase league auto-created on startup
# ✓ GET /leagues → returns showcase league
# ✓ POST /leagues → creates league, caller is LEAGUE_ADMIN
# ✓ GET /leagues/1/competitions → list
# ✓ GET /leagues/1/results/medal-board → medal board
# ✓ POST /leagues/1/admin/seed → seeds demo data

bun run dev:web
# ✓ / → leagues landing, showcase pinned at top
# ✓ /leagues/new → create form works
# ✓ /leagues/1/results → public medal board
# ✓ /leagues/1/dashboard → role-aware dashboard
# ✓ SSE /leagues/1/results/medal-board/stream → live updates

bun run check-types   # zero errors
bun run check         # zero errors
```

---

## Files Summary

### New backend

- `app/models/league.py`
- `app/routers/leagues.py`
- `app/services/league_service.py`
- `app/repositories/league_repository.py`
- `app/schemas/league.py`
- 3 Alembic migration files

### Renamed backend

- `week.py` → `competition.py` (model, schema, service, repository, router)

### Modified backend

- `app/models/user.py`, `competition.py`, `delegation.py`, `athlete.py`, `narrative.py`
- `app/core/deps.py`
- All routers, all services, `app/main.py`, `app/services/seed_service.py`

### New frontend

- `src/routes/leagues/` (full tree)
- `src/queries/leagues.ts`
- `src/routes/_authenticated/my-leagues/index.tsx`

### Modified frontend

- `src/routes/__root.tsx`
- `src/routes/_authenticated/_admin.tsx` → `_superadmin.tsx`
- `src/routes/_authenticated/_chief.tsx`
- `src/queries/keys.ts` + all query files
- `src/types/api.gen.ts` (regenerated)
