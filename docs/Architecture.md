# Architecture.md: ClinicOS Technical Architecture

> **Version policy:** Do not trust version numbers written from memory. At install time, check the latest stable release and the official install/migration docs of every dependency (`npm view <pkg> version`, official docs in the browser). Pin exact versions via the lockfile. If current docs differ from this file (e.g., config file names, CLI flags), follow the current docs and log an ADR in Memory.md.

## 1. System overview

```
                        ┌───────────────────────────────┐
   Browser / PWA  ───►  │  apps/web  (Next.js, TS)      │
   (staff, patient,     │  - (public)  clinic website   │
    public visitor)     │  - (portal)  patient portal   │
                        │  - (app)     staff app        │
                        └──────────────┬────────────────┘
                                       │ HTTPS  REST /api/v1  (+ SSE)
                        ┌──────────────▼────────────────┐
                        │  apps/api  (NestJS, TS)       │
                        │  modules · guards · services  │
                        └───┬─────────┬─────────┬───────┘
                            │         │         │
                 ┌──────────▼─┐  ┌────▼────┐  ┌─▼───────────┐
                 │ PostgreSQL │  │  Redis  │  │ S3 / MinIO  │
                 │ (Prisma)   │  │ cache + │  │ files, PDFs │
                 │            │  │ BullMQ  │  │             │
                 └────────────┘  └────┬────┘  └─────────────┘
                                      │
                        ┌─────────────▼─────────────┐
                        │ Worker (same codebase,    │
                        │ separate process)         │
                        │ email · SMS · reminders · │
                        │ PDFs · alerts · cleanup   │
                        └───────────────────────────┘
```

Deployment units: `web`, `api`, `worker` (same image as api with a different command), `postgres`, `redis`, `minio` (or real S3), reverse proxy (Caddy). Local dev also runs `mailpit` for email.

## 2. Technology stack (decisions)

| Concern | Choice | Notes |
|---|---|---|
| Monorepo | **pnpm workspaces + Turborepo** | `apps/*`, `packages/*` |
| Language | **TypeScript (strict)** everywhere | `noUncheckedIndexedAccess` on |
| Frontend | **Next.js (App Router) + React** | Server Components for public pages; client components for the app |
| Styling/UI | **Tailwind CSS + shadcn/ui (Radix)** | tokens from Design.md |
| Data fetching | **TanStack Query** + typed API client | generated from shared Zod schemas / OpenAPI |
| Forms/validation | **React Hook Form + Zod** | schemas shared from `packages/shared` |
| Tables/charts/calendar | TanStack Table, Recharts, a calendar lib you evaluate (FullCalendar or custom); decide via ADR | |
| Backend | **NestJS** (Express adapter) | modular monolith |
| Validation (API) | **Zod via `nestjs-zod`** (single source of truth with the web) | |
| ORM/DB | **PostgreSQL 16+ with Prisma** | raw SQL migrations for exclusion constraints, trigram indexes, partial indexes |
| Cache/queue | **Redis + BullMQ** | jobs, rate limiting store, short cache |
| Files | **S3-compatible (MinIO local)** via AWS SDK v3, presigned URLs | |
| PDFs | **pdfmake** (server-side) | invoices, receipts, prescriptions, reports, labels |
| Realtime | **Server-Sent Events (SSE)** | queue board, notifications |
| Auth | JWT access + rotating refresh (httpOnly cookie), **argon2id**, TOTP (`otplib`) | |
| Email | **Nodemailer (SMTP)**; Mailpit locally | provider interface |
| SMS/WhatsApp | `MessagingProvider` interface; `ConsoleProvider` default; one real adapter optional | |
| Payments | `PaymentProvider` interface; **Stripe (test mode)** adapter first | Razorpay/others = new adapter only |
| Logging | **pino** (structured, redacting) | request id, no PHI |
| API docs | **OpenAPI/Swagger** at `/api/docs` (non-prod or auth-protected) | |
| Testing | **Vitest** (web, shared), **Jest** (api) + **Supertest**, **Testcontainers or compose test DB**, **Playwright** E2E, **axe** a11y | |
| Quality | ESLint, Prettier, `tsc --noEmit`, Husky + lint-staged, Commitlint (Conventional Commits) | |
| CI | GitHub Actions (lint, typecheck, unit, integration w/ services, build, e2e on main) | |
| Containers | Multi-stage Dockerfiles, Docker Compose (dev + prod), Caddy for TLS | |

## 3. Repository layout

```
clinicos/
├─ AGENTS.md
├─ .agents/ (rules, workflows)
├─ docs/  (Product, Architecture, Rules, Design, Tasks, Memory + adr/ runbooks/ user-guide/)
├─ apps/
│  ├─ api/
│  │  ├─ prisma/ (schema.prisma, migrations/, seed/)
│  │  ├─ src/
│  │  │  ├─ main.ts  worker.ts  app.module.ts
│  │  │  ├─ common/ (config, logger, filters, interceptors, guards, decorators, pipes, utils, money, time)
│  │  │  ├─ infra/  (prisma, redis, queue, storage, mail, sms, payments, pdf, sse)
│  │  │  └─ modules/
│  │  │     auth  users  branches  departments  settings  audit
│  │  │     patients  documents  appointments  schedules  queue
│  │  │     encounters  vitals  prescriptions  medicines  lab
│  │  │     inventory  billing  payments  insurance
│  │  │     notifications  portal  public  reports  search
│  │  └─ test/ (integration + e2e helpers, factories)
│  └─ web/
│     ├─ src/
│     │  ├─ app/
│     │  │  ├─ (public)/   clinic website
│     │  │  ├─ (portal)/   patient portal
│     │  │  ├─ (app)/      staff application
│     │  │  ├─ (auth)/     login, reset, 2FA
│     │  │  └─ display/queue/  device-token board
│     │  ├─ components/ (ui/ shadcn, patterns/, features/<module>/)
│     │  ├─ lib/ (api client, auth, i18n, utils, hooks)
│     │  └─ styles/
│     └─ e2e/ (Playwright)
├─ packages/
│  └─ shared/ (zod schemas, enums, permissions, constants, types, money utils)
├─ infra/  (docker-compose.yml, docker-compose.prod.yml, Caddyfile, Dockerfiles, scripts/)
├─ .github/workflows/
├─ turbo.json  pnpm-workspace.yaml  package.json  tsconfig.base.json
└─ .env.example
```

Backend module convention (every module): `<name>.module.ts`, `<name>.controller.ts` (thin), `<name>.service.ts` (business logic), `<name>.repository.ts` (Prisma access, optional for simple modules), `dto/` (Zod-derived), `<name>.policies.ts` (permission/ownership checks), `__tests__/`.

## 4. Environment and configuration
All config via environment variables, validated at startup by a Zod schema; the process must **fail fast** with a clear message if invalid. Provide `.env.example` with every variable documented and **no real secrets**.

Key variables: `NODE_ENV`, `APP_URL`, `API_URL`, `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TTL=15m`, `REFRESH_TTL=7d`, `COOKIE_DOMAIN`, `FIELD_ENCRYPTION_KEY` (32-byte base64), `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `SMTP_HOST/PORT/USER/PASS/FROM`, `SMS_PROVIDER`, `PAYMENT_PROVIDER`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SENTRY_DSN` (optional), `RATE_LIMIT_*`, `DEFAULT_TIMEZONE`, `DEFAULT_CURRENCY`.

Local ports: web `3000`, api `4000`, postgres `5432`, redis `6379`, minio `9000` (console `9001`), mailpit `1025` (UI `8025`).

## 5. Database design (PostgreSQL + Prisma)

### 5.1 Conventions
- Primary keys: **UUIDv7 or cuid2** as `id String @id` (choose one via ADR; time-sortable preferred). Never expose sequential integers.
- Every table: `createdAt`, `updatedAt` (UTC `timestamptz`). Business tables also: `createdById`, `updatedById`, `branchId` (where relevant), `deletedAt` (soft delete where allowed).
- Money: **integer minor units** (`amountMinor Int/BigInt`) + `currency` on the document. Tax rates in **basis points**. Never floats.
- Enums as Prisma enums. Names are `snake_case` in DB via `@map`, `camelCase` in Prisma.
- Indexes for every foreign key and every list/search filter; `pg_trgm` GIN indexes on patient name/phone/email/MRN; `btree_gist` for exclusion constraints; partial unique indexes for "active only" uniqueness.
- Migrations are forward-only and reviewed; raw SQL migrations for what Prisma cannot express.
- Sensitive fields (national ID, insurance member ID optional) encrypted at the application layer (AES-256-GCM, versioned key id in the payload).

### 5.2 Entities (fields listed are the required core; add what implementation needs)
**Identity and org**
- `Branch`(id, code unique, name, address, phone, email, timezone, isActive, letterheadFileId)
- `User`(id, email unique, phone, passwordHash, firstName, lastName, isActive, mustChangePassword, twoFactorEnabled, twoFactorSecretEnc, lastLoginAt, failedLoginCount, lockedUntil)
- `UserRole`(userId, role) · `UserBranch`(userId, branchId, isPrimary)
- `StaffProfile`(userId 1-1, specialty, qualifications, licenseNo, signatureFileId, consultationFeeMinor, slotMinutes, bio, isPublic, photoFileId)
- `Department`(id, name, description, isActive) · `StaffDepartment`(userId, departmentId)
- `Session`(id, userId, familyId, refreshTokenHash, userAgent, ip, expiresAt, revokedAt, replacedById)
- `PasswordReset`(id, userId, tokenHash, expiresAt, usedAt) · `Invitation`(id, email, roles, branchIds, tokenHash, expiresAt, acceptedAt)
- `BackupCode`(userId, codeHash, usedAt)
- `AuditLog`(id, at, actorId, actorRole, action, entity, entityId, before jsonb, after jsonb, ip, userAgent, reason, requestId) **append-only** (DB rule/trigger blocks UPDATE/DELETE)
- `Setting`(key unique, value jsonb, branchId nullable) · `Sequence`(key, branchId, period, next) with row-level locking for gap-free numbers
- `FileObject`(id, bucket, key, mime, sizeBytes, sha256, ownerType, ownerId, category, uploadedById)
- `Consent`(id, patientId, type, version, grantedAt, revokedAt, source)

**Patients**
- `Patient`(id, mrn unique, firstName, lastName, dob, sex, phone, email, address jsonb, bloodGroup, maritalStatus, occupation, photoFileId, preferredLanguage, referralSource, nationalIdEnc, isVip, isDeceased, archivedAt, primaryBranchId, portalUserId?)
- `PatientContact`(patientId, name, relation, phone, isEmergency, isGuardian)
- `Allergy`(patientId, substance, reaction, severity, notedById, isActive) · `MedicalHistory`(patientId, type[CHRONIC|FAMILY|SOCIAL|SURGICAL|IMMUNIZATION], text, since)
- `PatientInsurance`(patientId, provider, policyNo, validFrom, validTo, coveragePct)
- `PatientDocument`(patientId, fileId, category, title, uploadedById)
- `PatientMergeLog`(fromPatientId, toPatientId, mergedById, reason, snapshot jsonb)

**Scheduling**
- `DoctorSchedule`(id, doctorId, branchId, weekday, startTime, endTime, slotMinutes, bufferMinutes, validFrom, validTo, maxOverbook)
- `ScheduleException`(id, doctorId, branchId?, type[LEAVE|HOLIDAY|EXTRA|BLOCK], startsAt, endsAt, reason, approvedById?)
- `AppointmentType`(id, name, defaultMinutes, feeMinor, mode[IN_PERSON|TELE], isPublic)
- `Room`(id, branchId, name)
- `Appointment`(id, patientId, doctorId, branchId, typeId, roomId?, startsAt, endsAt, status, source[STAFF|PORTAL|PUBLIC|WALKIN], reason, meetingUrl?, rescheduledFromId?, cancelReason?, cancelledById?, checkedInAt?, noShowAt?, `during tstzrange` generated)
  - **Exclusion constraint (raw SQL):** `EXCLUDE USING gist (doctor_id WITH =, during WITH &&) WHERE (status NOT IN ('CANCELLED','NO_SHOW'))`
- `Waitlist`(id, patientId, doctorId, date, status, offeredAt)
- `QueueToken`(id, branchId, doctorId, appointmentId, date, number, priority, status, calledAt, startedAt, doneAt) unique(branchId, doctorId, date, number)
- `DisplayDevice`(id, branchId, name, tokenHash, lastSeenAt)

**Clinical**
- `Encounter`(id, patientId, appointmentId?, doctorId, branchId, status[OPEN|SIGNED], startedAt, signedAt, signedById, visitType)
- `Vitals`(id, encounterId, recordedById, recordedAt, systolic, diastolic, pulse, tempC, respRate, spo2, heightCm, weightKg, bmi, painScore, glucose)
- `ClinicalNote`(id, encounterId, chiefComplaint, hpi, examination, assessment, plan, advice, followUpDate, templateId?) · `NoteAddendum`(id, encounterId, authorId, text, reason, createdAt)
- `Diagnosis`(id, encounterId, icd10Code, description, isPrimary) · `Icd10Code`(code, description, chapter) seeded
- `Referral`(id, encounterId, toName, toDepartment, reason, letterFileId?) · `MedicalDocument`(id, encounterId, type[CERTIFICATE|SICK_NOTE|SUMMARY], fileId)
- `NoteTemplate`(id, ownerId?, specialty, name, body jsonb)

**Medicines and prescriptions**
- `Medicine`(id, genericName, brandName, form, strength, route, controlledClass, defaultDose, isActive, inventoryItemId?)
- `InteractionRule`(id, ingredientA, ingredientB, severity, note)
- `Prescription`(id, encounterId, patientId, doctorId, status, issuedAt, cancelledAt, cancelReason, allergyOverrideReason?, notes)
- `PrescriptionItem`(id, prescriptionId, medicineId, dose, frequency, durationDays, timing, instructions, quantity, dispensedQty)
- `PrescriptionTemplate`(id, doctorId, name, items jsonb)

**Lab**
- `LabTest`(id, code unique, name, category, sampleType, tatHours, priceMinor, isPanel, isActive) · `LabTestParameter`(id, testId, name, unit, refRanges jsonb[sex, ageMin, ageMax, low, high, criticalLow, criticalHigh])
- `LabPanelItem`(panelId, testId)
- `LabOrder`(id, patientId, encounterId?, orderedById, branchId, status, priority, orderedAt, sampleCollectedAt, sampleBarcode) · `LabOrderItem`(id, orderId, testId, status)
- `LabResult`(id, orderItemId, parameterId, valueText, valueNum?, flag[NORMAL|LOW|HIGH|CRITICAL], enteredById, enteredAt, verifiedById?, verifiedAt?, releasedAt?)
- `LabAttachment`(orderId, fileId)

**Inventory**
- `InventoryItem`(id, type[MEDICINE|CONSUMABLE], name, sku unique, unit, reorderLevel, defaultSaleMinor, taxCategoryId?, isActive)
- `Supplier`(id, name, contact, phone, email, address)
- `StockBatch`(id, itemId, branchId, batchNo, expiryDate, purchaseMinor, saleMinor, qtyOnHand) unique(itemId, branchId, batchNo)
- `StockMovement`(id, itemId, batchId, branchId, type, qty(signed), refType, refId, reason, at, byId) **append-only**
- `PurchaseOrder`(id, supplierId, branchId, number, status, orderedAt, expectedAt) · `PurchaseOrderItem`(id, poId, itemId, qty, unitCostMinor, receivedQty)
- `GoodsReceipt`(id, poId?, supplierId, branchId, number, receivedAt, receivedById) · `GoodsReceiptItem`(id, grnId, itemId, batchNo, expiryDate, qty, unitCostMinor, saleMinor)
- `Dispense`(id, prescriptionId?, patientId?, branchId, dispensedById, at) · `DispenseItem`(id, dispenseId, itemId, batchId, qty, saleMinor)

**Billing**
- `TaxCategory`(id, name, rateBps, isInclusive)
- `Service`(id, code, name, category, priceMinor, taxCategoryId, isActive) · `ServicePriceOverride`(serviceId, branchId, priceMinor)
- `Invoice`(id, number?, branchId, patientId, encounterId?, status, currency, subtotalMinor, discountMinor, taxMinor, totalMinor, paidMinor, dueMinor, issuedAt, dueDate, voidedAt, voidReason, insurerShareMinor, patientShareMinor, fiscalYear)
- `InvoiceItem`(id, invoiceId, kind[SERVICE|LAB|MEDICINE|OTHER], refType, refId, description, qty, unitMinor, discountMinor, taxRateBps, taxMinor, totalMinor)
- `Payment`(id, invoiceId?, patientId, method, amountMinor, receivedAt, receivedById, reference, gateway, gatewayRef, idempotencyKey unique, shiftId?, status)
- `Refund`(id, invoiceId, paymentId?, amountMinor, reason, status[REQUESTED|APPROVED|PAID|REJECTED], requestedById, approvedById?)
- `CreditNote`(id, number, invoiceId, amountMinor, reason)
- `PatientWallet`(patientId, balanceMinor) + `WalletTransaction` (append-only)
- `CashShift`(id, branchId, openedById, openedAt, openingMinor, closedAt, closingCountedMinor, expectedMinor, varianceMinor)
- `InsuranceClaim`(id, invoiceId, patientInsuranceId, amountMinor, status, submittedAt, settledAt, notes) · `ClaimAttachment`
- `WebhookEvent`(id, provider, eventId unique, type, payload, processedAt) for idempotency

**Communication**
- `NotificationTemplate`(id, key, channel, locale, subject, body, isActive)
- `Notification`(id, userId?, patientId?, channel, templateKey, payload, status, attempts, lastError, sentAt, readAt)
- `ContactMessage`(id, name, email, phone, message, status, handledById?)
- `OtpCode`(id, target, purpose, codeHash, expiresAt, attempts, usedAt)

### 5.3 State machines (enforce in services with a transition table; reject illegal transitions with 409)
- **Appointment:** SCHEDULED > CONFIRMED > CHECKED_IN > IN_CONSULTATION > COMPLETED; SCHEDULED|CONFIRMED > CANCELLED; SCHEDULED|CONFIRMED|CHECKED_IN > NO_SHOW (staff only).
- **Encounter:** OPEN > SIGNED (terminal; addenda allowed).
- **Prescription:** DRAFT > ISSUED > PARTIALLY_DISPENSED > DISPENSED; DRAFT|ISSUED > CANCELLED.
- **LabOrder:** ORDERED > SAMPLE_COLLECTED > IN_PROCESS > RESULTED > VERIFIED; any pre-VERIFIED > CANCELLED.
- **Invoice:** DRAFT > ISSUED > PARTIALLY_PAID > PAID; DRAFT|ISSUED(no payments) > VOID.
- **PurchaseOrder:** DRAFT > ORDERED > PARTIALLY_RECEIVED > RECEIVED; DRAFT|ORDERED > CANCELLED.
- **Refund:** REQUESTED > APPROVED > PAID; REQUESTED > REJECTED.

## 6. API design

- Base path `/api/v1`. JSON only. Resource-oriented REST. OpenAPI generated and kept accurate.
- **Success envelope:** `{ "data": ..., "meta": { "page", "pageSize", "total", "nextCursor" } }` (meta only for lists).
- **Error format:** RFC 7807 style `{ "type", "title", "status", "code", "detail", "errors":[{ "path", "message" }], "requestId" }`. Stable machine `code` values (e.g., `APPOINTMENT_SLOT_TAKEN`, `ALLERGY_CONFLICT`, `INVALID_STATE_TRANSITION`).
- **Pagination:** offset (`page`, `pageSize` <= 100) for admin tables; cursor for feeds/timelines. **Sorting/filtering:** `sort=field:asc`, whitelisted filters only.
- **Idempotency:** `Idempotency-Key` header required on payment creation, refund, and public booking.
- **Concurrency:** optimistic concurrency via `updatedAt`/version (`If-Match` or `version` field) on clinical notes, invoices (draft), and settings.
- **Rate limits:** global default; stricter on auth, OTP, public booking, contact form.
- **Time:** ISO-8601 UTC in API; clinic timezone conversion only in UI/PDF layers.
- **Files:** upload through API validation (type sniffing, size cap) then to S3; downloads via short-lived presigned URLs after a permission check.

### 6.1 Endpoint catalog (implement all; add what is needed)
```
AUTH      POST /auth/login | /auth/refresh | /auth/logout | /auth/forgot-password | /auth/reset-password
          POST /auth/2fa/setup | /auth/2fa/verify | /auth/2fa/disable | GET /auth/me | GET/DELETE /auth/sessions[/:id]
          POST /auth/change-password | /auth/accept-invite
USERS     GET/POST /users | GET/PATCH /users/:id | POST /users/:id/deactivate|reactivate | POST /users/invite
BRANCH    CRUD /branches | CRUD /departments | CRUD /rooms
SETTINGS  GET/PUT /settings/:key | GET /settings/public | CRUD /tax-categories
PATIENTS  GET/POST /patients | GET/PATCH /patients/:id | POST /patients/duplicate-check | POST /patients/:id/merge
          POST /patients/:id/archive | GET /patients/:id/timeline | GET /patients/:id/summary
          CRUD /patients/:id/allergies|contacts|history|insurance|consents
          POST/GET /patients/:id/documents | GET /documents/:id/download-url | GET /patients/:id/card.pdf
SCHEDULE  CRUD /doctors/:id/schedules | CRUD /schedule-exceptions | GET /doctors/:id/slots?date=&typeId=
APPT      GET/POST /appointments | GET/PATCH /appointments/:id | POST /appointments/:id/{confirm|check-in|start|complete|cancel|no-show|reschedule}
          POST /appointments/walk-in | GET /appointments/calendar | CRUD /appointment-types | /waitlist
QUEUE     GET /queue?branch=&doctor=&date= | POST /queue/:id/{call|recall|skip|done} | GET /queue/stream (SSE)
          POST /display-devices | GET /display/queue (device token) | GET /display/queue/stream
EMR       POST /encounters | GET/PATCH /encounters/:id | POST /encounters/:id/{sign|addendum}
          PUT /encounters/:id/vitals | PUT /encounters/:id/note | PUT /encounters/:id/diagnoses
          GET /icd10?q= | CRUD /note-templates | POST /encounters/:id/{referral|certificate|sick-note} | GET /encounters/:id/summary.pdf
RX        GET /medicines?q= | CRUD /medicines | POST /prescriptions | GET /prescriptions/:id | POST /prescriptions/:id/{issue|cancel}
          POST /prescriptions/check-safety | CRUD /prescription-templates | GET /prescriptions/:id/pdf
LAB       CRUD /lab-tests | POST /lab-orders | GET /lab-orders | POST /lab-orders/:id/{collect|start|cancel|verify|release}
          PUT /lab-orders/:id/results | GET /lab-orders/:id/report.pdf | GET /patients/:id/lab-trends?parameter=
INVENTORY CRUD /inventory/items | /suppliers | GET /inventory/stock | GET /inventory/movements | POST /inventory/adjustments
          CRUD /purchase-orders | POST /purchase-orders/:id/{order|receive|cancel} | POST /dispenses | GET /inventory/alerts
BILLING   CRUD /services | POST /invoices | GET/PATCH /invoices/:id (draft only) | POST /invoices/:id/{issue|void|suggest-items}
          POST /invoices/:id/payments | POST /payments/:id/refund-request | POST /refunds/:id/{approve|reject|pay}
          POST /invoices/:id/credit-notes | GET /invoices/:id/pdf | GET /billing/outstanding
          POST /cash-shifts/open | POST /cash-shifts/:id/close | GET /cash-shifts | CRUD /insurance-claims
          POST /payments/online/intent | POST /webhooks/payments/:provider
NOTIFY    GET /notifications | POST /notifications/:id/read | GET /notifications/stream (SSE) | CRUD /notification-templates
PORTAL    POST /portal/register | /portal/verify | /portal/link-patient | GET /portal/me | CRUD /portal/dependents
          GET /portal/appointments|prescriptions|lab-reports|invoices | POST /portal/appointments | POST /portal/contact
PUBLIC    GET /public/clinic | /public/departments | /public/doctors[/:slug] | /public/slots | POST /public/booking/{otp|confirm}
REPORTS   GET /reports/{dashboard|collection|revenue|outstanding|appointments|patients|diagnoses|lab|inventory|cash} (?format=json|csv|xlsx|pdf)
AUDIT     GET /audit | GET /audit/export | POST /patients/:id/export | POST /patients/:id/anonymize
HEALTH    GET /health/live | GET /health/ready
```

## 7. Authentication, authorization and security

### 7.1 Auth flow
1. `POST /auth/login` validates credentials (argon2id verify, lockout check, optional TOTP step-up) > returns access token JWT (15 min, in JSON body, kept **in memory** by the web app) and sets the refresh token as an httpOnly, Secure, SameSite=Strict cookie (path `/api/v1/auth`).
2. `POST /auth/refresh` rotates the refresh token (store only a hash; `familyId` for reuse detection). Reuse of a rotated token revokes the family.
3. Access token claims: `sub`, `roles[]`, `branchIds[]`, `sid`, `iat`, `exp`. Permissions are resolved server-side from roles (never trust the client).
4. CSRF: refresh/logout endpoints require a custom header (`X-Requested-With`) plus SameSite=Strict; state-changing API calls use bearer tokens (not cookies), so they are not CSRF-prone.

### 7.2 RBAC: permission matrix
Permissions are strings `resource:action` defined in `packages/shared/permissions.ts` and mapped to roles. Guards: `@RequirePermissions('patient:read')` + branch scoping + ownership policies (e.g., a doctor can write notes only on their own encounters; a patient sees only their own/dependents' data).

Legend: **C**reate **R**ead **U**pdate **D**elete/deactivate **X**special (sign/issue/verify/approve). `own` = only own records; `br` = own branches only.

| Resource | OWNER | ADMIN | DOCTOR | NURSE | RECEPT. | PHARM. | LAB | ACCT. | PATIENT |
|---|---|---|---|---|---|---|---|---|---|
| Users / roles | CRUDX | CRU | R(self) | R(self) | R(self) | R(self) | R(self) | R(self) | own |
| Branches / settings | CRUD | CRU | R | R | R | R | R | R | none |
| Patients | CRUD | CRU | CRU | RU | CRU | R | R | R | own |
| Patient documents | CRUD | CRU | CRU | CR | CR | R | R | R | own (R) |
| Appointments | CRUD | CRUD | RU (own) | R | CRUD | R | R | R | own (CRD) |
| Queue | CRUD | CRUD | X (own) | RU | CRUD | R | R | none | none |
| Vitals | R | R | CRU | CRU | R | none | none | none | own (R) |
| Encounters / notes | R | R | CRUX (own) | R | none | none | none | none | own (R, released) |
| Prescriptions | R | R | CRUX (own) | R | none | R (dispense) | none | none | own (R) |
| Lab orders / results | R | R | CR + R | R | CR | none | CRUX | R | own (R, released) |
| Inventory / stock | CRUD | CRUD | R | R | none | CRUDX | R | R | none |
| Dispensing | R | R | none | none | none | CRX | none | R | none |
| Invoices | CRUX | CRUX | R | none | CRU (draft) + issue | CR (counter) | CR (lab) | CRUX | own (R) |
| Payments | CRX | CRX | none | none | CR | CR | none | CRUX | own (pay) |
| Refunds / credit notes | X approve | X approve | none | none | request | none | none | X approve | none |
| Reports | R all | R all | R own | none | R limited | R inv | R lab | R fin | none |
| Audit log | R | R | none | none | none | none | none | R (fin) | none |

Implement this matrix as data (single file) plus a test that asserts it. Update the matrix in code and in this document together via ADR if it changes.

### 7.3 Security controls (all mandatory)
- `helmet` security headers; strict CORS allowlist; CSP on the web app (nonce-based, no `unsafe-inline` scripts).
- Input validation on every endpoint (Zod); output serialization whitelists (never return password hashes, secrets, internal fields).
- Prisma parameterized queries only; any raw SQL is parameterized and reviewed.
- Rate limiting + progressive delays on auth/OTP; account lockout; bot protection on public booking (honeypot + per-IP/per-phone limits; optional Turnstile/hCaptcha behind an interface).
- File uploads: allowlist MIME by content sniffing, size limits, randomized keys, `Content-Disposition: attachment`, antivirus hook interface (no-op default, documented).
- Secrets only from env; never logged; `.env` gitignored; `pnpm audit`/`osv-scanner` in CI; secret scanning in CI.
- Logging redaction for: passwords, tokens, cookies, national ID, phone, email, and any request/response body of clinical modules. **No PHI in logs.**
- Field-level encryption for national ID; key rotation supported through key id in the ciphertext.
- Audit every clinical/billing/permission write and every sensitive read (documents, VIP charts, exports).
- Multi-branch isolation: every query on branch-scoped data includes the caller's branch scope (enforced in a shared Prisma extension/helper + tests).
- Session hygiene: revoke on password change/reset, on deactivation, on role change.

## 8. Key algorithms and critical implementation notes

### 8.1 Slot generation
Inputs: doctor, branch, date range, appointment type. Algorithm: expand weekly `DoctorSchedule` for each date in the branch timezone > subtract `ScheduleException` (LEAVE/HOLIDAY/BLOCK) > add `EXTRA` sessions > cut into slots (slotMinutes + buffer) > remove slots overlapping non-cancelled appointments > drop slots in the past (with lead-time setting) > return UTC instants. Cover DST edges and midnight-crossing sessions in tests. Public/portal/staff booking all call this **one** function.

### 8.2 Booking concurrency
Create appointment inside a transaction; rely on the **exclusion constraint** as the final guard; map the Postgres error `23P01` to `APPOINTMENT_SLOT_TAKEN` (409). Never implement "check then insert" as the only protection.

### 8.3 Gap-free numbering (invoices, PO, GRN, MRN)
`Sequence` table with `SELECT ... FOR UPDATE` inside the same transaction that issues the document. Numbers assigned only at ISSUE time (drafts have none). Rolled-back transactions must not consume numbers.

### 8.4 Money
Shared `money` util in `packages/shared`: integer minor units, basis-point tax, explicit rounding mode (half-up by default), inclusive/exclusive tax, allocation of invoice-level discount across lines without losing minor units (largest-remainder). 100% unit-tested with edge cases.

### 8.5 Stock and FEFO dispensing
In one transaction: lock candidate batches (`FOR UPDATE`), pick by earliest non-expired expiry with `qtyOnHand > 0`, split across batches if needed, create `StockMovement` rows, decrement batch qty with a `CHECK (qty_on_hand >= 0)` constraint, update prescription item `dispensedQty` and status, create/append invoice lines. Any failure rolls everything back.

### 8.6 Audit
A NestJS interceptor + explicit `audit.record()` calls in services for domain events. Audit rows are written in the same DB transaction as the change where feasible. DB trigger prevents UPDATE/DELETE on `audit_log`, `stock_movement`, `wallet_transaction`.

### 8.7 Realtime (SSE)
`/queue/stream`, `/notifications/stream`: authenticated, heartbeat every 25 s, `Last-Event-ID` resume, fan-out via Redis pub/sub so multiple API replicas work. Web uses an `EventSource` wrapper with auto-reconnect and polling fallback.

### 8.8 Background jobs (BullMQ queues)
`notifications` (email/SMS/WhatsApp, retries with exponential backoff, DLQ), `reminders` (scans upcoming appointments; idempotent via unique reminder keys), `pdf` (heavy generation off the request path when needed), `inventory-alerts` (nightly expiry/low stock), `maintenance` (expire OTP/sessions, purge tmp files), `reports` (scheduled exports). Every job is idempotent and logs job id + entity id (no PHI).

### 8.9 PDFs
One `PdfService` with typed templates: invoice, receipt, prescription, lab report, referral, certificate, sick note, visit summary, patient card, sample label. Letterhead from branch settings; fonts embedded; RTL-safe layout hook; deterministic output for snapshot tests (compare extracted text/structure).

### 8.10 Duplicate patient detection
`pg_trgm` similarity on normalized `firstName + lastName` combined with exact DOB, plus exact normalized phone/email. Return top 5 candidates with score and reason; UI requires explicit override with reason if score >= threshold.

## 9. Frontend architecture
- Route groups: `(public)` server-rendered with ISR/`revalidate` from `/public/*` endpoints; `(auth)`; `(app)` staff (client-side with TanStack Query); `(portal)`; `display/queue`.
- **Auth on web:** access token in memory + silent refresh; Next.js middleware only checks presence of the refresh-session hint cookie for redirects; real authorization always on the API. Permission-aware UI via `useCan('perm')` and `<Can>`; hiding UI is never the security boundary.
- **State:** server state in TanStack Query (query keys factory per module), UI state local/`zustand` only when truly global. No duplicated server state in global stores.
- **API client:** a single typed fetch wrapper: base URL, auth header, refresh-on-401 with request queue, problem+json error parsing, request id propagation, abort support.
- **Forms:** Zod schemas from `packages/shared`; server field errors mapped onto form fields; unsaved-changes guard; autosave for clinical notes.
- **Feature folder structure:** `components/features/<module>/{api.ts, hooks.ts, schemas.ts, components/, pages-parts/}`.
- **Performance:** route-level code splitting; virtualized long lists; image optimization; avoid client waterfalls (parallel queries/prefetch); bundle budget checks.
- **PWA:** manifest + service worker for the portal/public site (cache static assets, offline fallback page). Do **not** cache API responses containing PHI.
- **i18n:** `next-intl` (or equivalent chosen by ADR) with message catalogs; no hard-coded UI strings after Phase 0.

## 10. Testing strategy
- **Unit:** pure logic (money, slot engine, state machines, permission matrix, FEFO allocation, validators). Target >= 90% on those modules.
- **Integration (API):** real Postgres + Redis (compose/testcontainers); each endpoint tested for: success, validation error, unauthenticated (401), forbidden (403), not found, conflict/state error, branch isolation.
- **Component tests (web):** non-trivial components and forms (Testing Library).
- **E2E (Playwright):** the seven journeys in Product.md section 7 + auth + role visibility; run in CI against a seeded stack.
- **Accessibility:** axe checks in E2E on key pages; manual keyboard pass logged in Memory.
- **Security tests:** authz tests for IDOR (access another patient/branch), refresh reuse, rate limit, upload abuse.
- **Coverage gates in CI:** overall >= 75%, critical modules >= 90%.
- **Test data:** factories generate obviously fake data (`Test Patient 001`, `+1-555-0100`-style numbers, `@example.test` emails). Never realistic real-person data.

## 11. CI/CD and deployment
- GitHub Actions: `lint` > `typecheck` > `unit` > `integration (services: postgres, redis)` > `build` > `e2e (main/PR label)` > `docker build` > (tag) `publish images`.
- Dockerfiles: multi-stage, non-root user, minimal runtime image, healthchecks. `docker-compose.prod.yml` with Caddy (automatic TLS), api, worker, web, postgres, redis, minio or external S3, volumes, restart policies, resource limits.
- Migrations run as an explicit deploy step (`prisma migrate deploy`), never on app start in production.
- Backups: `pg_dump` scheduled + object storage sync, retention policy, **documented and tested restore** (runbook in `docs/runbooks/`).
- Zero-secrets images; config via env/secrets manager. Rollback procedure documented.

## 12. Observability
Structured JSON logs (pino) with `requestId`, `userId` (id only), `route`, `latency`, status. Health endpoints (live/ready with DB + Redis checks). Optional Sentry (PHI scrubbing on). Basic metrics endpoint (Prometheus format) behind auth/internal network. Slow-query logging threshold configurable.

## 13. Initial ADRs (pre-accepted; more go into Memory.md)
- **ADR-001** Modular monolith over microservices (team size, transactional integrity for billing/stock).
- **ADR-002** PostgreSQL exclusion constraint for double-booking prevention.
- **ADR-003** Integer minor units for money; basis points for tax.
- **ADR-004** SSE over WebSockets for one-way realtime.
- **ADR-005** Access token in memory + refresh token in httpOnly cookie.
- **ADR-006** Single-tenant deployment with `branchId` scoping; keep IDs and config tenant-agnostic so a `tenantId` can be added later.
- **ADR-007** Append-only ledgers (audit, stock, wallet) enforced by DB triggers.
- **ADR-008** Zod schemas shared between web and API as the contract source of truth.
