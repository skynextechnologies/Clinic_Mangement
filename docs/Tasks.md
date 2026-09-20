# Tasks.md: Ordered Work Plan (execute strictly in order)

**How to use:** Do the first unchecked task only. Follow `docs/Rules.md` (Definition of Done in section 4). When a task is done: tick `[x]`, add a one-line result note beneath it, update `docs/Memory.md`, commit. At the end of each phase: STOP, deliver a walkthrough artifact, wait for "CONTINUE".

Legend: **Depends** = tasks that must be done first · **Do** = required work · **Accept** = acceptance criteria (all must pass) · **Verify** = how you prove it.

---

## PHASE 0: Foundation

- [x] **T-001 · Monorepo scaffold and quality tooling**
  - Depends: none
  - Do: Create pnpm workspace + Turborepo (`apps/api`, `apps/web`, `packages/shared`, `infra`). Root `tsconfig.base.json` (strict, `noUncheckedIndexedAccess`), ESLint (flat config) + Prettier, `.editorconfig`, Husky + lint-staged + Commitlint (Conventional Commits), root scripts (`dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `infra:up`, `infra:down`, `db:*`), `.nvmrc`, `.gitignore`, `.env.example` (skeleton), `README.md` (short).
  - Accept: `pnpm install && pnpm lint && pnpm typecheck && pnpm build` succeed on a clean clone; a bad commit message is rejected by the hook; import-cycle lint rule active.
  - Verify: run the commands; attempt a bad commit; paste output in the report.
  - _Result (2026-09-20): Monorepo scaffolded with pnpm workspace + Turborepo; root tooling, ESLint 9 flat config, Prettier, Husky, Commitlint, and Vitest configured; all build, lint, typecheck, test steps passing 100%._

- [x] **T-002 · Local infrastructure with Docker Compose**
  - Depends: T-001
  - Do: `infra/docker-compose.yml` with postgres 16+ (extensions `pg_trgm`, `btree_gist` enabled via init script), redis, minio (+ bucket init), mailpit; named volumes; healthchecks; `pnpm infra:up/down/reset`. Document ports (Architecture section 4). Add `infra/scripts/wait-for-services`.
  - Accept: `pnpm infra:up` brings all services healthy; you can connect to Postgres and confirm extensions; MinIO console and Mailpit UI reachable.
  - Verify: `docker compose ps`, `psql` extension check, screenshots of MinIO/Mailpit UIs.
  - _Result (2026-09-20): Local Docker Compose infra configured with PostgreSQL 16 (pg_trgm and btree_gist extensions verified), Redis 7, MinIO (clinicos-files bucket initialized), Mailpit; wait-for-services script passing 100%._

- [x] **T-003 · Shared package: contracts, enums, permissions, money**
  - Depends: T-001
  - Do: `packages/shared` (built with tsup or tsc; consumable by web and api). Add: `PRODUCT_NAME` and app constants, role/permission enums and the RBAC matrix as data (from Architecture 7.2), status enums and **state-transition tables**, base Zod schemas (id, pagination, sort, problem+json error, phone E.164, money), `money` utilities (integer minor units, bps tax, rounding, inclusive/exclusive tax, largest-remainder allocation), date helpers.
  - Accept: 100% unit-test coverage on `money` and transition tables; permission-matrix test asserts every role x resource cell matches Architecture 7.2; package builds ESM+CJS types.
  - Verify: `pnpm --filter shared test --coverage`.
  - _Result (2026-09-20): Shared package @clinicos/shared implemented with constants, roles, enums, state transition tables, RBAC permission matrix (Architecture 7.2), base Zod schemas, integer minor unit money math, and date helpers; 100% unit-test line coverage verified._

- [x] **T-004 · API scaffold (NestJS) with platform essentials**
  - Depends: T-002, T-003
  - Do: `apps/api` with NestJS; Zod-validated config (fail-fast); pino logger with redaction + request id; global exception filter (problem+json); response envelope interceptor; `nestjs-zod` validation pipe; Helmet, CORS allowlist, compression; throttler (Redis store); health endpoints (`/health/live`, `/health/ready` checking DB + Redis); Swagger at `/api/docs`; graceful shutdown; separate `worker.ts` entrypoint; test harness (Jest + Supertest) with factories folder.
  - Accept: API boots; invalid env fails fast with a clear message; unknown routes return problem+json; `/health/ready` reports DB and Redis; a sample integration test passes; logs contain requestId and no bodies.
  - Verify: `pnpm --filter api test`, curl the health and docs endpoints.
  - _Result (2026-09-20): NestJS API scaffolded in apps/api with fail-fast Zod config, Pino logger, RFC 7807 problem+json exception filter, response envelope interceptor, Helmet, CORS, compression, Throttler, health endpoints (/health/live, /health/ready), Swagger OpenAPI docs (/api/docs), worker process entrypoint, and Supertest integration tests passing 100%._

- [x] **T-005 · Prisma setup, base schema, migrations, seed framework**
  - Depends: T-004
  - Do: Configure Prisma per **current official docs** (verify config format for the installed major version). Implement models: Branch, User, UserRole, UserBranch, StaffProfile, Department, StaffDepartment, Session, PasswordReset, Invitation, BackupCode, AuditLog, Setting, Sequence, FileObject (Architecture 5.2). Conventions from 5.1 (ids, timestamps, `@map`). Raw SQL migration: append-only triggers on `audit_log`; `Sequence` helper. Seed framework (idempotent) that creates default branch, OWNER user (from env, forced password change), default settings. `PrismaService` with a transaction helper and a branch-scope helper.
  - Accept: `pnpm db:reset` yields a clean DB with seed; trying to UPDATE/DELETE `audit_log` fails at DB level (tested); migrations apply from scratch in CI.
  - Verify: run reset twice (idempotent), run the trigger test.
  - _Result (2026-09-20): Prisma setup with 15 base models, PostgreSQL raw SQL append-only trigger for audit_log, idempotent seed framework (MAIN branch, OWNER user, settings, sequences), PrismaService & PrismaModule, and integration test verifying DB trigger enforcement passing 100%._

- [x] **T-006 · Web scaffold (Next.js) with design system foundation**
  - Depends: T-003
  - Do: `apps/web` (Next.js App Router + TypeScript), Tailwind + shadcn/ui set up per **current docs**, tokens from Design.md 3 (light/dark, `next-themes`), fonts via `next/font`, base layout, `lucide-react`, sonner toasts, TanStack Query provider, typed API client (base URL, problem+json parsing, request id), i18n scaffold with English catalog, error boundaries, `not-found`, route groups `(public) (auth) (app) (portal)`, `/dev/design-system` page rendering primitives and states. Set up Vitest + Testing Library.
  - Accept: `pnpm dev` serves the web app; dark/light toggle works with correct tokens; design-system page shows all primitives in all states; contrast of token pairs verified; Lighthouse a11y >= 95 on the design-system page.
  - Verify: browser screenshots at 375/768/1280 in both themes.
  - _Result (2026-09-20): Next.js 15 App Router scaffolded in apps/web with Inter Google Font, Tailwind CSS & next-themes (light/dark mode toggle), TanStack Query, Sonner toasts, typed REST API client (RFC 7807 error parsing & request ID propagation), route groups (public, auth, app, portal), and interactive visual Design System Showcase page at /dev/design-system._

- [x] **T-007 · CI pipeline**
  - Depends: T-005, T-006
  - Do: GitHub Actions: install (cached) > lint > typecheck > unit > integration (postgres+redis services, run migrations) > build; PR template; Dependabot/Renovate config; `pnpm audit` job (non-blocking for low severity); secret scanning step; coverage report artifact.
  - Accept: workflow file valid (`actionlint` if available); all jobs pass locally via `act` or an equivalent dry run/documented commands; README shows how CI maps to local commands.
  - Verify: run each CI step locally; attach output.
  - _Result (2026-09-20): GitHub Actions CI workflow (.github/workflows/ci.yml) configured with Postgres 16 & Redis 7 container services, pnpm cache, lint, typecheck, migration reset, unit & integration tests, and build steps; PR template (.github/PULL_REQUEST_TEMPLATE.md) and Dependabot (.github/dependabot.yml) configured; 100% local CI dry run verified._

**PHASE 0 GATE:** walkthrough artifact: repo tree, running infra, API docs page, design-system page screenshots, test output. STOP and wait for "CONTINUE".

---

## PHASE 1: Authentication, RBAC and Administration

- [x] **T-008 · Auth API: login, refresh rotation, logout, lockout, password reset**
  - Depends: T-005
  - Do: Implement FR-AUTH-01..05, 07 (API side): argon2id, login with lockout and generic errors, access JWT (15 min), refresh rotation with hashed tokens and family reuse detection, httpOnly cookie settings, logout (single/all), forgot/reset password (hashed single-use token, email via mail service + Mailpit), change password, sessions list/revoke, `GET /auth/me`. Password policy (min 12, common-password list). Audit auth events. Rate limits on auth routes.
  - Accept: tests for: success, wrong password, lockout after 5 attempts, unlock after 15 min (time frozen), refresh rotation, **reuse detection revokes family**, reset token single use + expiry, sessions revoked after password reset, no user enumeration (same response/timing class).
  - Verify: integration tests; manual curl flow; inspect Mailpit for reset email.
  - _Result (2026-09-20): Auth API implemented with argon2id password hashing, 5-attempt account lockout, 15m access JWT, httpOnly refresh token cookie rotation with family reuse detection, forgot/reset password, change password, sessions management, and Supertest integration tests passing 100%._

- [x] **T-009 · RBAC guards, permissions, branch scoping, audit interceptor**
  - Depends: T-008
  - Do: `@RequirePermissions()` decorator + guard using the shared matrix; ownership policy helper; branch-scope enforcement helper for queries; **deny-by-default** (a test/lint fails when a controller route lacks a permission or an explicit `@Public()`); audit interceptor + `audit.record()` service; audit read endpoint (Owner/Admin).
  - Accept: matrix-driven tests for every role on sample routes (401/403/200); IDOR test (user from branch A cannot access branch B record); audit rows created for writes.
  - Verify: run the route-coverage test that scans all controllers.
  - _Result (2026-09-20): RBAC permissions system implemented with `@RequirePermissions()` decorator, `PermissionsGuard` checking shared role matrix, `BranchScopeService`, `OwnershipPolicyService`, `AuditInterceptor` for automated mutation logging, `GET /audit` endpoint, and Deny-by-Default route scanner test passing 100%._

- [x] **T-010 · TOTP two-factor authentication**
  - Depends: T-008
  - Do: FR-AUTH-06: setup (QR/secret), verify, disable (requires password), backup codes (hashed, single-use), login step-up flow, policy "mandatory for roles" (setting), encrypted secret storage (AES-256-GCM helper in `common/crypto` with key id).
  - Accept: enrollment > login requires code; backup code works once; wrong codes are rate-limited; secret encrypted at rest (test reads raw DB row).
  - Verify: integration tests using `otplib` with frozen time.
  - _Result (2026-09-20): TOTP 2FA implemented with otplib, encrypted secret storage (AES-256-GCM), 10 single-use backup codes, login step-up flow, disable flow, backup codes regeneration, and 13 E2E tests passing 100%._

- [ ] **T-011 · Auth UI and session handling**
  - Depends: T-006, T-008, T-010
  - Do: Login, forgot/reset, 2FA challenge, accept invitation, change password, sessions page, account security page (enable 2FA with QR), auth provider (in-memory token + silent refresh + request queue), `useCan/<Can>`, middleware redirects, idle-timeout dialog (FR-AUTH-08), session-expired flow. Follow Design 6.1.
  - Accept: full flows work in the browser; refresh survives page reload; tokens are never in localStorage; idle warning appears at T-60 s; keyboard-only login works; a11y checks pass.
  - Verify: Playwright test for login/logout/refresh/reset with Mailpit API; screenshots.

- [ ] **T-012 · App shell, navigation and command palette**
  - Depends: T-011
  - Do: Staff shell per Design 4.1: sidebar (permission-filtered, collapsible, mobile drawer), top bar, breadcrumbs, branch switcher, user menu, theme toggle, notification bell (UI only), command palette (`Ctrl/Cmd+K`) with navigation actions, keyboard shortcuts dialog, page header component, 403/404/500 pages, dashboard placeholder page with real empty states.
  - Accept: nav items show/hide by role (tested for 3 roles); shell is responsive (drawer at < 1024); shortcuts work; focus order correct.
  - Verify: screenshots 375/768/1280 (light/dark) + Playwright role-visibility test.

- [ ] **T-013 · Staff, branches, departments, rooms (API + UI)**
  - Depends: T-009, T-012
  - Do: FR-STAFF-01..04: CRUD/deactivate users with roles and branches, invitations (email + accept flow), staff profile (photo/signature upload placeholder until T-017 wires storage; store fields now), departments, branches, rooms. DataTable pattern (server-side) built here and reused. Deactivation revokes sessions.
  - Accept: Owner can invite a doctor who accepts and logs in; deactivated user cannot log in and sessions die; validation and permission tests pass; DataTable supports sort/filter/pagination/column visibility.
  - Verify: integration + Playwright invite flow.

- [ ] **T-014 · Clinic settings and numbering**
  - Depends: T-013
  - Do: Settings service/API with typed keys (Zod per key), optimistic concurrency; UI sections: clinic profile, timezone, currency, locale, tax categories, numbering formats (MRN, invoice, PO, GRN; via `Sequence` with `FOR UPDATE`), working hours, holidays, cancellation policy, vital ranges, security policy (idle timeout, mandatory 2FA roles), feature flags. `GET /settings/public` for the public site.
  - Accept: changing timezone/currency reflects in UI formatting; sequence generator is gap-free under 50 concurrent issuance test; invalid settings rejected.
  - Verify: concurrency integration test; UI screenshots.

**PHASE 1 GATE:** walkthrough: auth flows, 2FA, roles matrix demo (log in as 3 roles), staff invite, settings. STOP and wait for "CONTINUE".

---

## PHASE 2: Patients

- [ ] **T-015 · Patients API (CRUD, search, MRN, duplicates, merge, archive)**
  - Depends: T-014
  - Do: Prisma models for Patient, PatientContact, Allergy, MedicalHistory, PatientInsurance, Consent, PatientMergeLog (Architecture 5.2); migration with `pg_trgm` GIN indexes; MRN generator (Sequence); national ID field-encrypted; endpoints for FR-PAT-01..06, 09, 11 (VIP break-glass with reason + audit); duplicate check (Architecture 8.10); merge (transactional re-pointing of related rows, snapshot, audit); archive (no hard delete); age/guardian rules (BR-02).
  - Accept: BR-01, BR-02, BR-14, BR-18 tests; typeahead search p95 < 200 ms on 100k seeded patients (benchmark script committed); IDOR/branch tests; encrypted field verified in DB; duplicate check returns expected candidates for fixtures.
  - Verify: run benchmark (`pnpm --filter api bench:patients`) and tests; report numbers.

- [ ] **T-016 · Patients UI: list, register, profile**
  - Depends: T-015
  - Do: Design 6.3: list with filters and typeahead, registration form with live duplicate panel and override reason, profile with tabs (Overview, Allergies, Contacts, Insurance, Consents; other tabs render empty states until their modules exist), `PatientPicker` and `PatientContextBar` + `AllergyBanner` shared components, VIP break-glass dialog, archive, merge UI (Admin) with typed confirmation.
  - Accept: register a patient in < 60 s keyboard-only (Playwright timing check informational); duplicate warning works; allergy banner appears across the profile; minor requires guardian.
  - Verify: Playwright journey "register + find + edit"; screenshots.

- [ ] **T-017 · File storage service and patient documents**
  - Depends: T-016
  - Do: S3/MinIO storage service (presigned upload/download, key randomization, sha256, content sniffing, size/type allowlist, AV hook interface), `FileObject` records, documents API (FR-PAT-07), permission + audit on every download URL issuance, `FileUploader` component with progress, PDF/image preview dialog, wire staff photos/signature/logo uploads.
  - Accept: upload/preview/download works; disallowed type/size rejected; URLs expire (<= 5 min); download attempt by an unauthorized role returns 403; audit rows exist.
  - Verify: integration tests against MinIO + Playwright upload.

**PHASE 2 GATE:** walkthrough. STOP and wait for "CONTINUE".

---

## PHASE 3: Scheduling and Queue

- [ ] **T-018 · Doctor schedules, exceptions and the slot engine**
  - Depends: T-017
  - Do: Models `DoctorSchedule`, `ScheduleException`, `AppointmentType`, `Room` usage; CRUD APIs; **slot engine** per Architecture 8.1 as a pure, well-documented module with property-style tests (DST changes, midnight-crossing, overlapping sessions, leave, extra sessions, lead time, buffer); `GET /doctors/:id/slots`. Schedule management UI (weekly grid editor, exceptions calendar, leave).
  - Accept: unit tests cover >= 25 scenarios incl. DST; API returns correct slots for fixtures; UI can define a week and a holiday and slots reflect it.
  - Verify: test report + screenshots.

- [ ] **T-019 · Appointments API with DB-enforced conflict prevention**
  - Depends: T-018
  - Do: Appointment model with generated `during` range and **exclusion constraint** (raw migration); endpoints for FR-APPT-01..08, 12; state machine service with permission per transition; reschedule linkage; cancellation window rules (BR-04); walk-in; audit; notification events emitted (consumed in T-033).
  - Accept: BR-03 test with **50 parallel booking attempts on one slot: exactly 1 succeeds, others 409 `APPOINTMENT_SLOT_TAKEN`**; illegal transitions 409; patient cannot cancel inside the window; all transitions audited.
  - Verify: concurrency integration test output in report.

- [ ] **T-020 · Appointments UI: calendar, booking drawer, list**
  - Depends: T-019
  - Do: Design 6.4: day/week/agenda calendar (evaluate FullCalendar vs custom; record ADR), filters, click-to-book drawer with `SlotPicker`, drag/resize reschedule with conflict feedback + undo, status actions (confirm, check-in, no-show, cancel with reason), walk-in dialog, list view with filters. Status badges per Design 3.3.
  - Accept: book/reschedule/cancel from UI; conflict shows friendly message and suggests nearest slots; calendar handles 200 events/day smoothly; keyboard accessible alternative to drag (menu action "Reschedule...").
  - Verify: Playwright journey "book > reschedule > cancel"; screenshots at three widths.

- [ ] **T-021 · Queue/token system with real-time SSE and display board**
  - Depends: T-020
  - Do: Token generation on check-in, priority ordering rules, call/recall/skip/done, wait-time estimate; SSE streams with Redis pub/sub, heartbeat, `Last-Event-ID`; `DisplayDevice` pairing (device token) and `/display/queue` board per Design 6.5 (large type, chime, masked names); staff queue page (columns) and doctor "Call next" widget.
  - Accept: two browser windows show updates within 1 s; SSE reconnect works after API restart; priority ordering test; display board reveals only masked names; a revoked device token stops working.
  - Verify: Playwright multi-page test + SSE integration test.

**PHASE 3 GATE:** walkthrough with the "walk-in > token > call next" scenario recorded. STOP and wait for "CONTINUE".

---

## PHASE 4: Clinical (EMR and Prescriptions)

- [ ] **T-022 · Encounters, vitals, SOAP notes, diagnoses, sign & lock**
  - Depends: T-021
  - Do: Models Encounter, Vitals, ClinicalNote, NoteAddendum, Diagnosis, Icd10Code (seed an open ICD-10 dataset; document source/licence), NoteTemplate. APIs for FR-EMR-01..07, 10. Encounter auto-created at check-in; vitals with BMI auto-calc and range flags (settings); autosave with optimistic concurrency; **sign & lock** and addenda (BR-05); permission: doctors only on own encounters. UI: Consultation workspace per Design 6.6 (left summary, center note sections, right orders panel placeholders for Rx/Lab), autosave indicator + local recovery, ICD-10 combobox, templates/snippets, sign confirmation dialog, read-only signed view + addendum dialog.
  - Accept: BR-05 tests (edit after sign fails 409, addendum works, original preserved); autosave survives a simulated network drop; nurse can enter vitals but cannot sign; allergy banner visible; note fields sanitized (XSS test).
  - Verify: integration + Playwright "consultation" journey; screenshots.

- [ ] **T-023 · Medicine catalog, prescriptions, safety checks, PDF**
  - Depends: T-022
  - Do: Models Medicine, InteractionRule (seed a small documented set + provider interface), Prescription, PrescriptionItem, PrescriptionTemplate. APIs FR-RX-01..06. Safety service: allergy conflict (blocks unless override reason, BR-11), duplicate ingredient, interaction warnings. Statuses and immutability after issue (BR-06). PDF service foundation (`PdfService` with letterhead from branch settings, fonts embedded) + prescription PDF including doctor signature and registration number. UI: prescription builder in the consult right panel (medicine combobox, frequency chips, duration, auto quantity, inline safety alerts), favorites, templates, "repeat previous", print/preview dialog identical to PDF.
  - Accept: allergy conflict blocks issue and override is audited; issued Rx cannot be edited; PDF text extraction matches expected content in a snapshot test; catalog admin UI works; controlled-class flag prints registration no.
  - Verify: tests + PDF sample attached in the report.

- [ ] **T-024 · Patient clinical summary, timeline and clinical documents**
  - Depends: T-023
  - Do: `GET /patients/:id/summary` and `/timeline` (cursor pagination; encounters, Rx, documents now; labs/invoices join later via a registry of timeline providers); referral letter, medical certificate, sick note, visit summary PDFs (FR-EMR-08); vitals trend chart; previous-visit quick view; patient profile tabs Timeline/Encounters/Prescriptions become live.
  - Accept: timeline loads < 300 ms p95 for a patient with 500 events; PDFs render with letterhead; permission tests (receptionist cannot read clinical content).
  - Verify: performance script + tests + screenshots.

**PHASE 4 GATE:** walkthrough of full doctor flow. STOP and wait for "CONTINUE".

---

## PHASE 5: Laboratory

- [ ] **T-025 · Lab catalog, orders, results, verification, reports**
  - Depends: T-024
  - Do: Models LabTest, LabTestParameter, LabPanelItem, LabOrder, LabOrderItem, LabResult, LabAttachment (Architecture 5.2); seed ~30 common tests with plausible reference ranges (documented as sample data to be reviewed by a clinician). APIs FR-LAB-01..07 with status machine, auto flag computation by sex/age band, critical values raise an urgent notification event, two-step verify/release (BR-12). Sample barcode/QR label PDF and report PDF. UI: catalog admin, orders from consult (right panel) and front desk, lab worklist tabs, result-entry grid, verification screen, trend chart, patient Lab tab.
  - Accept: flag computation unit-tested across age/sex boundaries; unverified results invisible to patient endpoints; critical value event emitted; label and report PDFs generated; full flow order > collect > result > verify > release works in UI.
  - Verify: tests + Playwright "lab flow".

**PHASE 5 GATE:** walkthrough. STOP and wait for "CONTINUE".

---

## PHASE 6: Pharmacy and Inventory

- [ ] **T-026 · Inventory items, suppliers, batches, purchase orders, receiving, ledger**
  - Depends: T-025
  - Do: Models InventoryItem, Supplier, StockBatch, StockMovement (append-only trigger), PurchaseOrder(+Item), GoodsReceipt(+Item) with gap-free numbering; link Medicine to InventoryItem; APIs FR-INV-01..03, 07, 09; adjustments with reason + permission; valuation and movement queries; `CHECK (qty_on_hand >= 0)`. UI: items table with stock chips, batch drawer, movement history, adjust dialog, supplier CRUD, PO builder, receiving flow capturing batch and expiry.
  - Accept: BR-10 (ledger immutable, tested at DB level); on-hand derived from ledger equals batch qty (reconciliation test); receiving creates batches + movements atomically; negative stock impossible even under concurrency.
  - Verify: integration + concurrency tests; screenshots.

- [ ] **T-027 · Dispensing (FEFO), counter sales, alerts**
  - Depends: T-026
  - Do: Dispense API per Architecture 8.5 (transactional FEFO with row locks, partial dispense, override with reason), counter sales, returns; prescription status updates; inventory alert job (low stock, 90/30-day expiry) via BullMQ + in-app notification events; pharmacist dashboard and dispensing screen (Design 6.7).
  - Accept: BR-09 tests (FEFO order, expired excluded, no negative stock); **concurrent dispense of the last unit: one succeeds**; partial dispense sets `PARTIALLY_DISPENSED`; alert job idempotent; dispensing produces billable lines (consumed in T-029).
  - Verify: tests + Playwright "pharmacy flow".

**PHASE 6 GATE:** walkthrough. STOP and wait for "CONTINUE".

---

## PHASE 7: Billing and Payments

- [ ] **T-028 · Service catalog, tax categories, price overrides**
  - Depends: T-027
  - Do: Models TaxCategory, Service, ServicePriceOverride; APIs and UI (catalog table, tax settings integration); seed sample services (consultation, follow-up, common procedures).
  - Accept: branch price override resolution tested; tax categories in bps; permissions per matrix.
  - Verify: tests + screenshots.

- [ ] **T-029 · Invoices: build, issue, void, credit notes, numbering, PDF**
  - Depends: T-028
  - Do: Models Invoice, InvoiceItem, CreditNote; totals via shared `money` only; suggest-items from encounter, lab orders and dispenses; discounts with role max % and approver (BR-13); issue assigns gap-free number inside the transaction (BR-08); ISSUED immutable (BR-07); void rules; credit notes; invoice PDF (tax lines, letterhead). Audit everything.
  - Accept: property-based tests for totals/tax/rounding/allocation; concurrent issue of 50 invoices yields gap-free sequential numbers; edits to ISSUED rejected; void blocked when payments exist; PDF snapshot test.
  - Verify: test output including concurrency and property tests.

- [ ] **T-030 · Payments, receipts, wallet, cash register shifts, outstanding**
  - Depends: T-029
  - Do: Models Payment, PatientWallet/WalletTransaction (append-only), CashShift; APIs FR-BILL-07, 09..11: split/partial payments, advance deposits, receipt PDF, shift open/close with expected vs counted, outstanding + aging; idempotency keys on payment creation; invoice status recomputation (PARTIALLY_PAID/PAID) transactional.
  - Accept: overpayment rejected; idempotent replay returns the same payment; shift totals match payments; aging buckets correct in tests; permission matrix enforced.
  - Verify: integration tests.

- [ ] **T-031 · Billing UI: invoice builder, payment dialog, cash register, dues**
  - Depends: T-030
  - Do: Design 6.8: invoice builder with auto-suggest panel, totals card, discount approval hint, issue confirmation; payment dialog (methods, split, change calc, wallet), receipt preview/print; cash register screens; outstanding list; invoice list/detail with status timeline; patient Billing tab.
  - Accept: Journey 1 (Product 7) completes through payment and receipt; invoice created and paid in < 45 s in a Playwright timing check (informational); all money displays tabular and locale-aware; keyboard operable.
  - Verify: Playwright journey + screenshots.

- [ ] **T-032 · Refunds, approvals, online payments (gateway), insurance claims**
  - Depends: T-031
  - Do: Refund workflow with approval and limits (BR-17), credit note link; `PaymentProvider` interface + Stripe (test mode) adapter: payment intent creation, hosted checkout/link, **webhook endpoint with signature verification and `WebhookEvent` idempotency**; portal-ready payment links; insurance split billing and `InsuranceClaim` lifecycle with attachments. UI for refund requests/approvals, claims list/detail.
  - Accept: webhook replay does not double-post; invalid signature rejected 400; refund > paid amount rejected; approval by a different user required when configured; claim status transitions audited.
  - Verify: tests using recorded/mock provider payloads plus a documented manual test with test keys (human supplies keys).

**PHASE 7 GATE:** walkthrough of consult-to-payment plus refund. STOP and wait for "CONTINUE".

---

## PHASE 8: Notifications

- [ ] **T-033 · Notification engine, templates, reminders, in-app SSE**
  - Depends: T-032
  - Do: Models NotificationTemplate, Notification, OtpCode; BullMQ queues (Architecture 8.8), email via SMTP/Mailpit, `MessagingProvider` interface with `ConsoleProvider` (default, logs to a dev outbox table/UI) and a documented real adapter stub-free contract; templates with variables + preview, per-locale; preferences; reminder scheduler (24 h/2 h, idempotent keys, respects patient prefs); consume domain events (appointments, lab release, invoices/payments, stock alerts, critical lab values); in-app notifications API + SSE + bell UI; delivery log UI with retry; template editor in Settings.
  - Accept: booking triggers confirmation email visible in Mailpit; reminder jobs fire once per appointment/offset even if scheduler runs twice; failed jobs retry with backoff then land in DLQ view; bell updates in real time; transactional messages cannot be disabled by preferences.
  - Verify: integration tests with fake timers + Playwright checking Mailpit + bell.

**PHASE 8 GATE:** walkthrough. STOP and wait for "CONTINUE".

---

## PHASE 9: Patient Portal and Public Website

- [ ] **T-034 · Public website (SEO-ready)**
  - Depends: T-033
  - Do: `(public)` pages per Design 6.11 fed by `/public/*` endpoints (ISR with revalidation): Home, About, Services/Departments, Doctors + profile, FAQs, Contact form (rate-limited, creates `ContactMessage` + staff inbox), Privacy, Terms; admin-editable content blocks (Settings > Website content); metadata, Open Graph, JSON-LD, `sitemap.xml`, `robots.txt`; premium responsive design; consent banner only if analytics enabled.
  - Accept: content changes in Settings appear on the site after revalidation; Lighthouse Performance/Accessibility/Best Practices/SEO >= 90 on mobile emulation for Home and Doctor profile; no fake stats/testimonials; structured data validates.
  - Verify: Lighthouse reports attached; screenshots at three widths.

- [ ] **T-035 · Online booking flow (public)**
  - Depends: T-034
  - Do: Booking wizard (FR-SITE-04) using the same slot engine; OTP verification (hashed codes, attempt limits, resend timer); idempotent confirm endpoint (`Idempotency-Key`); creates or matches patient safely (never overwrites existing patient data from unauthenticated input; flags for staff review); `.ics` download; abuse protection (honeypot, per-IP/phone limits, captcha interface); confirmation email.
  - Accept: end-to-end booking works and appears on the staff calendar; slot-taken race handled gracefully; brute-force OTP blocked; no PHI leak (endpoint reveals nothing about existing patients).
  - Verify: Playwright journey 2 + abuse tests.

- [ ] **T-036 · Patient portal**
  - Depends: T-035
  - Do: FR-PORTAL-01..06: registration/verification, safe linking to existing patient record (OTP + DOB), dependents, appointments (book/reschedule/cancel with policy), released visit summaries, prescription PDFs, lab reports after release, invoices + online payment via T-032, profile/consents/notification preferences, contact form; mobile-first UI per Design 6.10; PWA manifest + service worker (no PHI caching).
  - Accept: a portal user can only ever access their own and their dependents' data (IDOR tests across every endpoint); unreleased labs invisible; payment flow works in test mode; Lighthouse PWA/a11y pass; installable on mobile emulation.
  - Verify: Playwright portal journeys + authz test suite.

**PHASE 9 GATE:** walkthrough with recordings of public booking > staff sees it > portal view. STOP and wait for "CONTINUE".

---

## PHASE 10: Analytics and Governance

- [ ] **T-037 · Dashboards and reports**
  - Depends: T-036
  - Do: Reports API (Architecture 6.1) using efficient SQL (indexes, materialized views only if measured necessary) with branch/date filters and CSV/XLSX/PDF export; role-specific dashboards per Design 6.2; report pages with chart + table + export; scheduled weekly owner email (FR-REP-03, optional flag).
  - Accept: numbers reconcile with source data in a seeded-fixture test (e.g., collection report equals sum of payments); each dashboard KPI links to filtered list; report endpoints p95 < 500 ms on seeded demo data (measured); permission matrix enforced.
  - Verify: reconciliation tests + performance script + screenshots.

- [ ] **T-038 · Audit viewer, patient data export and anonymization, retention**
  - Depends: T-037
  - Do: Audit viewer UI (filters, detail drawer with before/after diff, export); patient data export (JSON + PDF) and anonymization workflow with typed confirmation and retention checks (FR-AUD-03), configurable retention settings, break-glass access report.
  - Accept: export includes all patient-linked data categories; anonymization irreversibly removes identifiers while preserving aggregate/financial integrity; everything audited; only permitted roles can run it.
  - Verify: integration tests + a documented manual walkthrough.

**PHASE 10 GATE:** walkthrough. STOP and wait for "CONTINUE".

---

## PHASE 11: Hardening, Documentation and Release

- [ ] **T-039 · Security hardening pass**
  - Depends: T-038
  - Do: Review against Architecture 7.3 and OWASP ASVS L2 highlights: CSP (nonce) on web, cookie flags, CORS allowlist, rate limits tuned, upload abuse tests, IDOR test sweep over **every** route (script enumerating routes), dependency audit, secret scan, verify log redaction with tests, verify no PHI in logs, review Prisma raw queries, session/refresh edge cases, security headers test. Write `docs/security-review.md` (findings, fixes, residual risks).
  - Accept: automated route-enumeration authz test passes for all roles; zero high/critical audit findings unresolved or explicitly accepted with reason; log-redaction tests pass.
  - Verify: attach test output and the review document.

- [ ] **T-040 · Performance pass**
  - Depends: T-039
  - Do: Seed 100k patients, 500k appointments/encounters (scripted, fake data); run EXPLAIN on hot queries, add indexes, remove N+1s; add response caching only where safe; frontend bundle analysis and budgets; virtualize long lists; Lighthouse on key pages.
  - Accept: targets in Product section 3 met or gaps documented with numbers; no query > 200 ms in the hot path list; initial JS for staff dashboard within the agreed budget recorded in Memory.md.
  - Verify: benchmark output and bundle report.

- [ ] **T-041 · Accessibility and responsive audit**
  - Depends: T-040
  - Do: axe in Playwright over all main routes in light/dark; manual keyboard pass and screen-reader smoke test on critical flows (login, register patient, book appointment, consultation, payment, public booking, portal); fix issues; verify 200% zoom and reduced-motion; verify print styles for prescription, invoice, receipt, token slip, lab report.
  - Accept: zero serious/critical axe violations; keyboard-only completion of the 7 journeys documented; print outputs verified.
  - Verify: axe report + notes in Memory.md.

- [ ] **T-042 · Test completion and E2E suite**
  - Depends: T-041
  - Do: Ensure Playwright covers all 7 journeys in Product section 7 plus role-visibility and auth edge cases; close coverage gaps (overall >= 75%, critical modules >= 90%); make the suite stable (no flaky tests: fix root causes); wire E2E into CI on main.
  - Accept: full suite green 3 consecutive runs; coverage gates enforced in CI.
  - Verify: three run logs + coverage report.

- [ ] **T-043 · Seed and demo data**
  - Depends: T-042
  - Do: `pnpm db:seed:demo` creating a realistic **fake** clinic: branches, 12 staff across roles, 300 patients, schedules, a week of appointments, encounters, prescriptions, lab orders/results, inventory with batches (some near expiry/low), invoices/payments/refunds, notifications. Clearly marked as demo; never runs in production (guard by env).
  - Accept: fresh clone > `pnpm infra:up && pnpm db:reset && pnpm db:seed:demo && pnpm dev` yields a rich, coherent demo where every dashboard has data; production guard test passes.
  - Verify: run it from scratch; screenshots of dashboards.

- [ ] **T-044 · Documentation**
  - Depends: T-043
  - Do: Root `README.md` (what, screenshots, quick start, architecture summary, commands), `docs/user-guide/` per role (with screenshots), `docs/runbooks/` (deploy, backup/restore, rotate secrets/keys, incident response, add a new payment/SMS provider), `docs/api.md` (auth, conventions, errors; link to Swagger), module READMEs (R-83), `CONTRIBUTING.md`, `SECURITY.md`, `LICENSE` placeholder (ask the human which license), data-protection notes (what PHI is stored, where, how it is protected; legal review required disclaimer).
  - Accept: a new developer can run the project and complete the demo journey by following README only (verify by literally following it in a clean clone).
  - Verify: clean-clone dry run recorded in Memory.md.

- [ ] **T-045 · Production packaging and deployment**
  - Depends: T-044
  - Do: Multi-stage Dockerfiles (web, api/worker), `docker-compose.prod.yml` with Caddy (TLS), healthchecks, restart policies, resource limits, non-root users; `.env.production.example`; migration deploy step; backup scripts (`pg_dump` + object sync) with retention; **restore drill executed and documented**; release workflow (tag > build > push images); rollback procedure; smoke-test script against a running stack.
  - Accept: `docker compose -f docker-compose.prod.yml up` on a clean machine (or clean local project) serves the app over HTTP locally with health checks green; backup then restore into a fresh DB reproduces data; images run as non-root and contain no secrets.
  - Verify: smoke test output + restore drill log. (Do not deploy to a public server; provide instructions and ask the human.)

- [ ] **T-046 · Final QA and release checklist**
  - Depends: T-045
  - Do: Walk every FR in Product.md and mark implemented/verified (create `docs/traceability.md` mapping FR > module > test); fix gaps or list them explicitly; run the full verify suite, E2E, Lighthouse, axe, audit; produce `docs/release-notes.md` (v1.0.0) and `docs/known-issues.md`; tag `v1.0.0`.
  - Accept: traceability shows every Must requirement covered by tests; no P0/P1 defects open; final human review requested.
  - Verify: attach traceability table + full test/coverage output.

**FINAL GATE:** present the release walkthrough and hand over. The project is complete only after the human confirms.
