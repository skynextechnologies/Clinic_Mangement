# AGENTS.md: ClinicOS (read this first, every session)

You are working on **ClinicOS**, a complete clinic management system (monorepo: `apps/web`, `apps/api`, `packages/shared`).

## Mandatory read order at the START of every session / task
1. `docs/Memory.md`: current state, decisions, gotchas, where we stopped.
2. `docs/Rules.md`: how you must behave (non-negotiable).
3. `docs/Tasks.md`: find the first unchecked task; do only that task.
4. Only the relevant sections of `docs/Architecture.md`, `docs/Design.md`, `docs/Product.md`.

## Non-negotiables (summary; full text in Rules.md)
- One task at a time. Never skip ahead. Never leave TODOs or stubs.
- Verify library APIs against current official docs before using them. Do not guess.
- No PHI (patient data) in logs, URLs, error messages, or test fixtures that look real.
- Every task ends with: lint + typecheck + tests green, docs/Tasks.md ticked, docs/Memory.md updated, a commit.
- UI must follow `docs/Design.md` and be checked in the browser at 375px, 768px and 1280px widths.

## Common commands (keep this list current; update in Memory.md when changed)
- `pnpm install`: install deps
- `pnpm dev`: run web + api (after infra is up)
- `pnpm infra:up` / `pnpm infra:down`: docker compose for postgres, redis, minio, mailpit
- `pnpm db:migrate` / `pnpm db:seed` / `pnpm db:reset`
- `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm test:e2e` / `pnpm build`
