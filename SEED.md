# Seeding

## Automatic Startup Seeds

When the API server starts, two idempotent seed routines run inside the `lifespan` context (after Alembic migrations):

1. **`seed_sports()`** — Global, runs once per empty database.
   - Creates the 10 canonical sports, their modalities, and statistics schemas.
   - Safe to call repeatedly; exits immediately if any `Sport` row exists.

2. **`seed_showcase_league()`** — Idempotent showcase league creation.
   - Creates a single showcase league (`is_showcase=true`, `slug="showcase"`) if none exists.
   - Assigns the first superadmin found in `users` as both creator and `LEAGUE_ADMIN`.
   - Populates `sports_config` with all active sport IDs.
   - Sets `auto_simulate=true` and `transfer_window_enabled=true`.
   - If no superadmin exists yet (fresh database), it logs a warning and skips.

## Manual League Seed

### `POST /leagues/{league_id}/admin/seed`

League admins can trigger a one-time demo seed for their league.

- **Idempotency**: Returns `409 Conflict` if the league already has any delegation.
- **What it creates**:
  - 4 delegations with generated chiefs and athletes
  - 1 completed competition
  - Events, matches, and medal results across the first 5 sports
- **Auth**: Requires `LEAGUE_ADMIN` membership.

### Example

```bash
curl -X POST "http://localhost:3000/leagues/1/admin/seed" \
  -H "Authorization: Bearer <token>"
```

## Showcase League Details

| Field                     | Value             |
| ------------------------- | ----------------- |
| `name`                    | Showcase League   |
| `slug`                    | showcase          |
| `auto_simulate`           | true              |
| `transfer_window_enabled` | true              |
| `timezone`                | America/Sao_Paulo |

The showcase league is intended for platform demonstration and automated CI/testing. All scheduler jobs (auto-lock, auto-start, auto-finish, reminders) iterate over **all active leagues**, but auto-simulation only runs for leagues where `auto_simulate=true`.
