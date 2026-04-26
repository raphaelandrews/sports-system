<!-- intent-skills:start -->

## Skill Loading

Before substantial work:

- Skill check: run `npx @tanstack/intent@latest list`, or use skills already listed in context.
- Skill guidance: if one local skill clearly matches the task, run `npx @tanstack/intent@latest load <package>#<skill>` and follow the returned `SKILL.md`.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

# AGENTS.md

## Response Style

- Prefer fragments over full prose when clarity remains intact.
- Keep answers compact unless the user asks for detail.

## Core Rules

- Use `bun` for JS and `uv` for Python. Never use `npm`, `yarn`, or direct `pip`.
- Prefer small edits to existing files. Avoid speculative abstractions, placeholders, and backward-compat shims unless explicitly required.
- Comments only for genuinely non-obvious logic.
- TypeScript: strict, no `any`. Python: type hints everywhere, Pydantic v2 for schemas.

## Repo

```text
apps/web/       TanStack Start frontend
apps/api/       FastAPI backend
packages/ui/    shared shadcn/ui
packages/env/   env validation
packages/config shared TS config
packages/infra/ Cloudflare deploy
```

## Frontend

- In `apps/web/src/`, use `@/` imports only; no relative `../`.
- Reuse `packages/ui/src/components/` before building custom UI.
- Share `queryOptions()` between loaders and `useSuspenseQuery`.
- Use route guards via `beforeLoad`.
- Never manually edit `routeTree.gen.ts`.

## Backend

- Mandatory layering: `router -> service -> repository -> model`.
- Routers stay thin, services own business logic, repositories own DB access.
- Keep schemas in `schemas/` and SQLModel models in `models/`.
- Use `background_tasks` for async side work.

## Time And Automation

- Store timestamps in UTC; business logic uses `ZoneInfo(settings.TIMEZONE)`; API datetimes include offsets.
- Transfer window is a pure service-layer time check in the configured business timezone.
- Week auto-lock runs via APScheduler every 5 minutes after the first event time passes and triggers bracket/schedule generation.
- `AUTO_SIMULATE=true` enables scheduler-driven auto-start/finish; `simulation_service` generates sport-specific results without an LLM.
- `POST /admin/simulate/match/{id}` must work regardless of `AUTO_SIMULATE`.
- Enrollment validation should use `modality.rules_json`, not per-sport hardcoding when the generic engine fits.

## Infra

- Railway backend must run a single `uvicorn` process; multiple workers break SSE.
- SSE must go browser -> Railway directly, not through Cloudflare Workers.
- Use `EventSourceResponse(generator, ping=20)`.
- `slowapi` uses `app/core/limiter.py`; include `request: Request` first when required.
- Use `ORJSONResponse` for app and exception handlers.

## References

- `README.md`
- `SEED.md`
- `CLAUDE.md`
- `TIMEZONE=America/Sao_Paulo`
