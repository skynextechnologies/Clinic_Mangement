# Memory.md: Living Project Memory (update after EVERY task)

> Purpose: let any agent (or human) resume work with zero chat history. Keep it accurate, concise and current. Delete stale entries instead of piling up. Never store secrets or PHI here.

## 1. Project snapshot
- **Product:** ClinicOS (working name; constant `PRODUCT_NAME` in `packages/shared`)
- **Repo layout:** pnpm + Turborepo monorepo: `apps/web` (Next.js), `apps/api` (NestJS + Prisma + PostgreSQL), `packages/shared`, `infra/`, `docs/`
- **Status:** NOT STARTED (brain files created; waiting for human "APPROVED")
- **Docs precedence:** Rules.md > Memory ADRs > Architecture.md > Product.md > Design.md > Tasks.md

## 2. Current Pointer (update every task)
- **Phase:** 0
- **Last completed task:** none
- **Next task:** T-001
- **In progress / what remains:** nothing yet
- **Branch:** main
- **Last commit:** (none)

## 3. Decisions log (ADR-lite: date · decision · reason · alternatives rejected)
| ID | Decision | Reason |
|---|---|---|
| ADR-001 | Modular monolith (NestJS) + separate worker process | Transactional integrity for billing/stock; small team; simpler ops |
| ADR-002 | Postgres exclusion constraint prevents double-booking | Correct under concurrency, independent of app code |
| ADR-003 | Money as integer minor units; tax in basis points | No floating-point errors |
| ADR-004 | SSE for realtime (queue board, notifications) | One-way updates, simpler than WebSockets, proxy-friendly |
| ADR-005 | Access token in memory + refresh token httpOnly cookie | Mitigates XSS token theft |
| ADR-006 | Single-tenant deployment with branch scoping; tenant-ready IDs/config | Scope control; SaaS possible later |
| ADR-007 | Append-only ledgers (audit, stock, wallet) via DB triggers | Tamper resistance, compliance |
| ADR-008 | Zod schemas shared between web and API | Single source of truth for contracts |
| (add) | Environment choice: `.agents/` vs `.agent/` directory | (record what this workspace uses) |

## 4. Conventions in force (short)
- Conventional Commits with task id; one branch per phase (`phase/NN-name`).
- IDs: choose UUIDv7 or cuid2 in T-005 and record here: **(pending)**.
- Money: `packages/shared/money`; timestamps UTC; clinic timezone at edges only.
- Test data: fake only (`Test Patient 001`, `@example.test`, `+1-555-01xx`).
- API base: `/api/v1`; success envelope `{data, meta}`; errors RFC 7807 style with stable `code`.
- Ports: web 3000 · api 4000 · postgres 5432 · redis 6379 · minio 9000/9001 · mailpit 1025/8025.

## 5. Environment and commands (keep in sync with AGENTS.md)
| Need | Command |
|---|---|
| Install | `pnpm install` |
| Start infra | `pnpm infra:up` (stop: `pnpm infra:down`, wipe: `pnpm infra:reset`) |
| DB | `pnpm db:migrate` · `pnpm db:seed` · `pnpm db:reset` · `pnpm db:seed:demo` (later) |
| Dev | `pnpm dev` |
| Quality | `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm test:e2e` · `pnpm build` |
| API docs | http://localhost:4000/api/docs |
| Mail UI | http://localhost:8025 |
| Storage UI | http://localhost:9001 |
(Update this table as tasks add scripts. Record verified versions of Node/pnpm/Postgres/Next/Nest/Prisma here after T-001..T-006.)

**Installed versions (fill in as installed):** node: — · pnpm: — · postgres: — · next: — · nest: — · prisma: — · tailwind: — · playwright: —

## 6. Gotchas and lessons learned
(Add: version quirks, config surprises, flaky-test causes, tool behaviors in Antigravity. One line each with date and task id.)
- (empty)

## 7. Open questions for the human
(Add: unresolved ambiguities. Mark resolved ones with the answer and delete after 2 tasks.)
- Default currency/timezone/tax presets for the first deployment? (Currently configurable; defaults USD/UTC/no tax.)
- Which SMS/WhatsApp provider and payment gateway will be used in production? (Interfaces exist; adapter chosen later.)
- Which license should the repository carry? (Needed at T-044.)
- Is a trunk-only workflow preferred over branch-per-phase? (Default: branch-per-phase.)

## 8. Proposals (agent suggestions needing human approval)
- (empty)

## 9. Tech debt register
| Date | Task | Debt | Proposed fix | Priority |
|---|---|---|---|---|
| (empty) | | | | |

## 10. Quality logs
- **Performance budgets:** (record after T-040): initial JS staff dashboard: — · API p95 list/search: — · patient search p95: —
- **Accessibility:** (record after T-041): axe status, keyboard pass notes
- **Security:** (record after T-039): link to `docs/security-review.md`, residual risks
- **Test coverage:** (record after T-042): overall — · critical modules —

## 11. Progress log (newest first; one entry per task)
Format: `YYYY-MM-DD · T-xxx · what was built · evidence (tests/screens) · notes`
- (empty)

## 12. Resume checklist (for a fresh session)
1. Read sections 2, 5, 6, 7 of this file, then `docs/Rules.md`.
2. `git status` and `git log -5`; make sure the working tree matches "Current Pointer".
3. `pnpm infra:up` then `pnpm install` then `pnpm db:migrate`.
4. Run `pnpm lint && pnpm typecheck && pnpm test` to confirm the baseline is green before changing anything.
5. Open `docs/Tasks.md`, continue at the Next task above using `/next-task`.
