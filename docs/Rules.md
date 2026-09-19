# Rules.md: Operating Rules for the AI Agent (non-negotiable)

These rules apply to every task. If a user instruction conflicts with a rule in sections 3 or 5 (safety and security), stop, explain, and ask before proceeding.

## 1. Session protocol
- **R-01** Start every session/task by reading `docs/Memory.md`, then this file, then the current task in `docs/Tasks.md`. Do not rely on chat history alone.
- **R-02** Work on **exactly one task at a time**, in order. Never start a task whose "Depends on" items are unchecked. Never batch several tasks in one commit.
- **R-03** Use **Planning mode** for each new task/phase (write a short plan first); use fast mode only for trivial fixes inside an already-approved task.
- **R-04** Do not run multiple agents in parallel on tasks that touch the same files or the same DB schema. Parallel work is allowed only for independent, non-overlapping tasks and must be declared in Memory.md.
- **R-05** After every task: run `/verify`, tick `docs/Tasks.md`, update `docs/Memory.md`, commit. If Memory.md is not updated, the task is not done.
- **R-06** After every phase: stop, provide a walkthrough artifact (features built, how to try them, test results, screenshots/recordings), then wait for the human to say "CONTINUE".
- **R-07** When blocked or when requirements are ambiguous: (a) choose the safest, most conventional interpretation, (b) record it in Memory.md > Decisions or Open Questions, (c) continue. Ask the human only if the choice is irreversible, security-relevant, or changes product scope.

## 2. Truthfulness and verification
- **R-10** **Never invent** APIs, flags, config keys, package names or versions. Check the official docs (browser/search) before using any library API you are not 100% sure is current. Record version-related surprises in Memory.md > Gotchas.
- **R-11** **Never claim** something works unless you ran it. Report failures honestly, with the error output. "Should work" is not acceptable.
- **R-12** Do not silence errors to make checks pass: no `@ts-ignore`, `any`, `eslint-disable`, skipped tests, loosened validation, or deleted assertions, unless justified in a code comment **and** logged in Memory.md.
- **R-13** Never fake integrations. External providers (SMS, payment, etc.) go behind interfaces with a real local/dev driver and a real adapter; never hard-code success responses.
- **R-14** UI work must be verified in a real browser session (Antigravity browser): happy path, empty, loading, error, keyboard, and widths 375/768/1280. Attach screenshots.

## 3. Safety rules for the environment and data
- **R-20** Never run destructive commands outside the project directory (`rm -rf` on anything not clearly inside this repo, `sudo`, disk formatting, killing unrelated processes). Inside the repo, never delete `docs/`, `.git/`, or `prisma/migrations/`.
- **R-21** Never `git push --force`, rewrite shared history, or commit directly to a protected `main` if a branch workflow exists. Never commit secrets, `.env`, dumps, or real personal data.
- **R-22** Never run migrations, seeds or destructive SQL against anything except the local/dev/test databases defined in `.env`. If a `DATABASE_URL` does not point to `localhost`/the compose service, stop and ask.
- **R-23** Never install packages from unknown sources or run remote scripts piped to a shell. Prefer well-maintained packages with recent releases; check download counts, maintenance, and license (no GPL/AGPL in the runtime path without an ADR).
- **R-24** Never disable security features (auth guards, CSRF/CORS rules, rate limits, input validation, TLS) to "make it work" or to demo. Fix the cause.
- **R-25** Ask the human to perform: creating cloud accounts, entering real API keys, paying for anything, sending real SMS/WhatsApp/emails to external addresses, deploying to a public server.

## 4. Definition of Done (every task)
A task is **done** only if ALL are true:
1. Requirements in the task's **Acceptance Criteria** are met and demonstrated.
2. `pnpm lint`, `pnpm typecheck`, `pnpm test` pass; `pnpm build` passes when relevant.
3. New behavior has tests (unit + integration for API logic; component/E2E where UI flows changed). Bug fixes include a regression test.
4. API: Zod validation, auth guard, permission check, branch scoping, audit entry (if applicable), OpenAPI docs, tested 401/403/404/409 cases.
5. UI: follows `docs/Design.md`; accessible (labels, focus, contrast, keyboard); responsive; has loading/empty/error states; strings via i18n; no layout shift.
6. DB: migration created (never edit applied ones), indexes added, constraints enforced in the DB, seed updated when needed, rollback considered.
7. No `console.log`, `TODO`, `FIXME`, commented-out code, dead code, unused deps, or debugging leftovers in the diff.
8. No PHI in logs, URLs, error messages, analytics, or test fixtures.
9. `docs/Tasks.md` ticked with a one-line result note; `docs/Memory.md` updated; Conventional Commit made.

## 5. Security and privacy rules
- **R-30** Treat all patient data as PHI. Minimum necessary access; every read of sensitive resources by role is checked server-side. UI hiding is never authorization.
- **R-31** No PHI in: logs, URLs/query strings, error messages, Sentry payloads, test snapshots, seed data. Use obviously fake data (`Test Patient 001`, `@example.test`, `+1-555-01xx`).
- **R-32** Passwords: argon2id only. Tokens and OTPs: store hashes only. Never log or return secrets.
- **R-33** Every endpoint declares its permission explicitly. **Deny by default**: a new route without a permission decorator must fail a lint/test check.
- **R-34** Use parameterized queries only. Any `$queryRaw` must use tagged templates with parameters and be justified in a comment.
- **R-35** Validate and sanitize all input at the boundary; encode output; set file upload limits and content sniffing.
- **R-36** Financial, stock and audit records are append-only or immutable after issue. Never `UPDATE`/`DELETE` them to "fix" data; use compensating entries.
- **R-37** Multi-step writes (billing, stock, appointments, merges) run in DB transactions; use row locks where races are possible; add tests that simulate concurrency.
- **R-38** Dependency hygiene: run `pnpm audit` on dependency changes; do not add a dependency for something achievable in ~20 lines.

## 6. Code standards
- **R-40** TypeScript strict. No `any`; use `unknown` + narrowing. Shared constants (product name, roles, enums) live in `packages/shared`; **no hard-coded product name, currency, timezone, tax, locale, or URLs** in code.
- **R-41** Functions are small and single-purpose (guideline < 40 lines, files < 300 lines; split by responsibility). Prefer pure functions for business logic; keep controllers thin, services cohesive, repositories dumb.
- **R-42** Naming: `camelCase` variables/functions, `PascalCase` types/components, `SCREAMING_SNAKE_CASE` constants, `kebab-case` file names, DB `snake_case`. Names describe domain intent (`issueInvoice`, not `handleClick2`).
- **R-43** Errors: throw typed domain errors with stable `code`s; never swallow exceptions; never expose stack traces to clients. Log with context (ids, not PHI).
- **R-44** Comments explain **why**, not what. Public utilities and non-obvious algorithms (slot engine, money, FEFO) get doc comments with examples.
- **R-45** No magic numbers or strings: use named constants/enums. Configurable business values go to settings, not code.
- **R-46** Dates/times: store UTC; use a single date library consistently; convert to clinic timezone only at UI/PDF edges; never use `new Date(string)` parsing for user input without validation.
- **R-47** Money only through the shared `money` utilities (integer minor units). Never use floating-point for currency.
- **R-48** Imports: absolute aliases (`@/`, `@clinicos/shared`); no deep relative chains (`../../../`); no circular dependencies (enforce with a lint rule).
- **R-49** Every package script needed by CI must exist at the root (`lint`, `typecheck`, `test`, `build`, `test:e2e`).

## 7. Git and change management
- **R-50** Conventional Commits: `feat|fix|chore|docs|test|refactor|perf|build|ci(scope): message`. One logical change per commit; commit message references the task id (e.g., `feat(patients): T-015 patient CRUD API`).
- **R-51** Work on a branch per phase (`phase/03-scheduling`); merge to `main` only after the phase gate (human "CONTINUE"). If the human prefers trunk-only, log it in Memory.md.
- **R-52** Do not refactor unrelated code inside a feature task. If you see a needed refactor, add it under Memory.md > Tech Debt and propose a task.
- **R-53** Never modify `docs/Product.md`, `docs/Architecture.md`, `docs/Design.md` or this file without explicit human approval; log architecture changes as ADRs in Memory.md.
- **R-54** Database migrations are immutable once committed. To change: add a new migration. Name them descriptively (`202609201200_add_patient_trgm_index`).

## 8. UI/UX rules (details in Design.md)
- **R-60** Use the design tokens and shadcn/ui primitives; do not introduce ad-hoc colors, fonts, spacing or shadows. If a token is missing, add it to the token file and to Memory.md.
- **R-61** Every screen has: page title, breadcrumbs (staff app), loading skeleton, empty state with a helpful action, error state with retry, success feedback (toast), and a confirmation dialog for destructive actions.
- **R-62** Forms: visible labels (no placeholder-only labels), inline validation on blur/submit, error summaries for long forms, disabled+spinner on submit, prevent double submit, keep the user's input on errors.
- **R-63** Data tables: server-side pagination/sort/filter, sticky header, row actions menu, column visibility, CSV export where specified, keyboard row navigation.
- **R-64** Accessibility is not optional: semantic HTML first, ARIA only when needed, focus management for dialogs/toasts, `prefers-reduced-motion` respected, contrast >= 4.5:1, touch targets >= 44px on mobile.
- **R-65** Clinical screens prioritize safety: the allergy banner and patient identity (name, age/sex, MRN) are always visible; destructive/irreversible clinical actions (sign, issue, cancel) require explicit confirmation showing what will happen.
- **R-66** Never use lorem ipsum or fake stats in shipped UI. Empty data shows an empty state. Copy is clear, calm and human (see Design.md microcopy).

## 9. Testing rules
- **R-70** Write the test with the feature, not after. Business-rule code (BR-xx in Product.md) has tests named after the rule (`BR-03 prevents overlapping appointments`).
- **R-71** Integration tests use a real Postgres. Do not mock the database for repository/service integration tests.
- **R-72** Tests are deterministic: freeze time, seed RNG, isolate data per test (transaction rollback or unique schema), no dependence on test order.
- **R-73** A failing test is fixed by fixing the code or the test's incorrect expectation, with a reason in the commit message. Never delete or skip to go green.
- **R-74** Add at least one negative and one permission test for each new endpoint.

## 10. Documentation and memory rules
- **R-80** Keep `docs/Memory.md` accurate and concise. Record: what changed, decisions (with reason), commands, gotchas, open questions, tech debt. Remove stale info instead of piling up.
- **R-81** Keep `AGENTS.md` command list current.
- **R-82** Maintain `docs/adr/` only if the human requests; otherwise ADRs live in Memory.md.
- **R-83** Each module gets a short README section (purpose, endpoints, permissions, business rules, events) in `docs/` at the end of its phase.
- **R-84** Public-facing docs (README, user guide, runbooks) are written for humans, with copy-pasteable commands you have actually run.

## 11. Communication rules
- **R-90** Progress reports are short and factual: what was done, evidence (test output/screenshots), what is next, blockers. No hype, no vague claims.
- **R-91** If you disagree with a document or find a better approach, say so in Memory.md > Proposals with reasoning; do not silently deviate.
- **R-92** If a task turns out larger than expected (> ~1 day of human-equivalent work), split it in Tasks.md (e.g., `T-019a`, `T-019b`) after logging the reason, and continue with the first part.
- **R-93** When you finish, do not write long summaries. Follow the report format: result, evidence, next step.
