# Seeding

## Startup Seeds

Backend startup runs this sequence inside FastAPI `lifespan`:

1. Alembic `upgrade head`
2. `seed_sports()`
3. `seed_showcase_league()`

Source:

- [`apps/api/app/main.py`](/home/raphael/Documents/projects/sports-system/apps/api/app/main.py:67)
- [`apps/api/app/services/seed_service.py`](/home/raphael/Documents/projects/sports-system/apps/api/app/services/seed_service.py:774)

## `seed_sports()`

Purpose:

- insert the canonical sports set
- insert each sport's modalities
- insert sport statistics schemas

Behavior:

- idempotent
- exits immediately if any `Sport` row already exists

## `seed_showcase_league()`

Purpose:

- create the default showcase league once

Behavior:

- idempotent
- exits if a showcase league already exists
- looks for the first user with global role `SUPERADMIN` or legacy `ADMIN`
- skips with a warning if no such user exists yet

Created league fields:

- `name="Showcase League"`
- `slug="showcase"`
- `description="Default showcase league with full automation"`
- `is_showcase=true`
- `auto_simulate=true`
- `transfer_window_enabled=true`
- `timezone="America/Sao_Paulo"`
- `sports_config=[all active sport ids]`

Also created:

- `LeagueMember` row linking that user as `LEAGUE_ADMIN`

## First Superadmin Bootstrap

Important:

- the seed code does **not** create a superadmin
- `POST /auth/register` creates `ATHLETE`, not `SUPERADMIN`
- there is currently no API endpoint to promote a user to `SUPERADMIN`

Bootstrap flow:

1. Start backend once
2. Register the owner account
3. Promote that user in SQL
4. Restart backend

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

Password rules from [`apps/api/app/schemas/auth.py`](/home/raphael/Documents/projects/sports-system/apps/api/app/schemas/auth.py:6):

- at least 8 chars
- at least 1 uppercase letter
- at least 1 symbol

Promotion SQL:

```sql
UPDATE users
SET role = 'SUPERADMIN'
WHERE email = 'owner@example.com';
```

Then restart backend. On startup `seed_showcase_league()` will detect that user and create the showcase league.

## Manual League Demo Seed

Endpoint:

- `POST /leagues/{league_id}/admin/seed`

Source:

- [`apps/api/app/routers/admin.py`](/home/raphael/Documents/projects/sports-system/apps/api/app/routers/admin.py:49)

Requirements:

- caller must be a `LEAGUE_ADMIN` of that league
- startup sports seed must already exist

Idempotency:

- returns `409 Conflict` if any delegation already exists in the target league

What it creates:

- 4 delegations: `BRA`, `ARG`, `POR`, `ESP`
- 1 chief user per delegation
- 6 athlete users per delegation
- `LeagueMember` rows for chiefs and athletes
- `DelegationMember` rows
- athlete modality assignments
- 1 completed competition
- completed events, matches, medals, and results across the first 5 sports

Example:

```bash
curl -X POST http://localhost:3000/leagues/1/admin/seed \
  -H "Authorization: Bearer <access-token>"
```

## Troubleshooting

`seed_showcase_league` logs warning and does nothing:

- no `SUPERADMIN` or `ADMIN` row exists yet

`POST /leagues/{league_id}/admin/seed` returns sports error:

- backend was not restarted after first migrations/seed
- sports table is empty

Showcase league not created after promotion:

- backend needs a restart because startup seed already ran before the role change
