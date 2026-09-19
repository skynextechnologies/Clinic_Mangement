# Product.md: ClinicOS Product Definition

## 1. Vision and positioning
**ClinicOS** is an all-in-one, web-based clinic management system. It replaces paper registers, spreadsheets and disconnected billing tools with one reliable system that covers: patient registration, appointments and queue, clinical records (EMR), prescriptions, lab, pharmacy/inventory, billing and payments, patient portal, public clinic website with online booking, reports, and audit.

**One-liner:** *"From front desk to prescription to payment, one calm, fast system for the whole clinic."*

**Target customers:** single-doctor clinics up to multi-specialty polyclinics (1 to 50 staff, 1 to 5 branches, up to ~100,000 patient records).

**Differentiators:** speed at the front desk (keyboard-first), safe clinical workflows (allergy checks, locked notes with addenda), immutable financial records, complete audit trail, and a patient-friendly portal.

## 2. Personas
| Persona | Goals | Pain points today |
|---|---|---|
| **Owner / Admin** | Control the clinic, see revenue and performance, manage staff and settings | No visibility, revenue leakage, staff mistakes |
| **Receptionist** | Register patients, book/reschedule, manage queue, collect payment fast | Double bookings, long queues, duplicate patient records |
| **Doctor** | See the patient's full history quickly, write notes and prescriptions fast | Slow software, retyping, missing history |
| **Nurse** | Record vitals, assist doctor, manage samples | Duplicate data entry |
| **Pharmacist** | Dispense accurately, track stock and expiry | Expired stock, wrong dispensing, no reorder alerts |
| **Lab Technician** | Track samples, enter and verify results | Lost samples, manual reports |
| **Accountant** | Reconcile cash, track dues and refunds | Manual reconciliation, no audit |
| **Patient** | Book online, get reminders, see prescriptions/reports/bills, pay online | Calling the clinic, losing paper records |

## 3. Success metrics (product acceptance targets)
- Register a new patient in **< 60 s**; find an existing patient in **< 5 s** (typeahead < 200 ms server time).
- Book an appointment in **< 30 s** from the front desk.
- Doctor: open patient chart to finished prescription in **< 3 min** for a routine visit.
- Create and collect an invoice in **< 45 s**.
- **Zero** double-bookings (enforced in the database, not only in code).
- 95th percentile API latency **< 300 ms** for list/search endpoints at 100k patients.
- WCAG 2.2 AA on all patient-facing pages; Lighthouse Performance and SEO **>= 90** on public pages.

## 4. Scope
### In scope (v1)
Auth + RBAC + 2FA, staff/branches/departments, patients, appointments + schedules + queue, EMR (vitals, SOAP notes, diagnoses), prescriptions, lab, pharmacy + inventory, billing + payments + refunds + basic insurance claims, notifications (email + SMS/WhatsApp via provider interface), patient portal, public website + online booking, dashboards + reports + exports, audit log, settings, PWA-installable.
### Out of scope (v1): do not build
Native mobile apps, video-call hosting (only store an external meeting URL), DICOM/PACS imaging, real-time payer adjudication, payroll/HR beyond staff profiles + leave, AI diagnosis, pediatric growth charts, multi-tenant SaaS billing. (Design data model so multi-tenant could be added later; see Architecture ADR-006.)

## 5. Roles (summary; full permission matrix in Architecture.md)
`OWNER` (super admin), `ADMIN`, `DOCTOR`, `NURSE`, `RECEPTIONIST`, `PHARMACIST`, `LAB_TECH`, `ACCOUNTANT`, `PATIENT`. A user may hold multiple roles and be assigned to multiple branches.

## 6. Functional requirements
Priority: **M** = must, **S** = should, **C** = could.

### 6.1 Authentication and account security (AUTH)
- FR-AUTH-01 (M) Email + password login for staff. Patients log in to the portal with email or phone + password, or one-time code.
- FR-AUTH-02 (M) Short-lived access token (15 min) plus rotating refresh token (7 days) in an httpOnly, Secure, SameSite cookie. Refresh-token reuse detection revokes the whole token family.
- FR-AUTH-03 (M) Lockout after 5 failed attempts for 15 minutes; generic error messages (no user enumeration).
- FR-AUTH-04 (M) Password policy: min 12 chars; reject common/breached passwords list (local list); argon2id hashing.
- FR-AUTH-05 (M) Forgot/reset password via single-use, 30-minute emailed token; invalidate all sessions after reset.
- FR-AUTH-06 (M) Optional TOTP 2FA with backup codes; configurable "mandatory for OWNER/ADMIN/DOCTOR".
- FR-AUTH-07 (M) User can view and revoke active sessions/devices.
- FR-AUTH-08 (M) Idle timeout for staff (default 30 min, configurable) with a warning dialog 60 s before logout.
- FR-AUTH-09 (M) Staff invitation by email; invited user sets password on first login.

### 6.2 Staff, branches, departments (STAFF)
- FR-STAFF-01 (M) CRUD users with roles and branch assignment; deactivate instead of delete.
- FR-STAFF-02 (M) Staff profile: photo, phone, specialty, qualifications, license/registration number, signature image, default consultation fee, default slot duration, bio/public visibility flag.
- FR-STAFF-03 (M) Departments/specialties CRUD; doctors belong to one or more departments.
- FR-STAFF-04 (M) Branches CRUD with code, address, phone, working hours, letterhead.
- FR-STAFF-05 (S) Leave requests and approval that automatically block the doctor's schedule.

### 6.3 Patients (PAT)
- FR-PAT-01 (M) Register: first/last name, DOB, sex, phone (E.164), email, address, blood group, marital status, occupation, photo, emergency contact(s), preferred language, referral source, national ID (encrypted, optional). If age < 18, guardian details are required.
- FR-PAT-02 (M) Auto-generated **MRN** (format configurable, default `{BRANCH}-{YY}-{000001}`), unique and never reused.
- FR-PAT-03 (M) Duplicate detection at create time (fuzzy name + DOB, phone match). Warn, show matches, allow override with reason. Admin merge tool with full audit.
- FR-PAT-04 (M) Search by name, MRN, phone, email; typeahead; recent patients list.
- FR-PAT-05 (M) Allergies (substance, reaction, severity), chronic conditions, family and social history, immunizations (basic list).
- FR-PAT-06 (M) Insurance policies (provider, policy no, valid from/to, coverage %).
- FR-PAT-07 (M) Documents upload (PDF/JPG/PNG, <= 10 MB) with categories and inline preview; access is permission-checked and audited.
- FR-PAT-08 (M) Unified timeline: encounters, labs, prescriptions, invoices, documents in chronological order with filters.
- FR-PAT-09 (M) Consents captured with timestamp and version (treatment, data processing, communications).
- FR-PAT-10 (S) Print patient card / sample label with QR code containing the MRN.
- FR-PAT-11 (M) VIP/restricted flag: access requires a "break-glass" reason that is audited.

### 6.4 Appointments and scheduling (APPT)
- FR-APPT-01 (M) Doctor weekly schedule templates per branch: multiple sessions per day, slot length, buffer time, max overbook (default 0).
- FR-APPT-02 (M) Schedule exceptions: leave, holiday, extra session, blocked time.
- FR-APPT-03 (M) Appointment types (In-person, Follow-up, Procedure, Teleconsult) each with duration and fee; Teleconsult stores an external meeting URL.
- FR-APPT-04 (M) Booking from staff app, patient portal and public site using the **same slot engine**.
- FR-APPT-05 (M) **Double-booking prevention enforced at DB level** (see Architecture: exclusion constraint) with friendly conflict messages.
- FR-APPT-06 (M) Status machine: `SCHEDULED > CONFIRMED > CHECKED_IN > IN_CONSULTATION > COMPLETED`; also `CANCELLED`, `NO_SHOW`. Every transition is audited and permission-checked.
- FR-APPT-07 (M) Walk-in: create appointment + queue token in one action.
- FR-APPT-08 (M) Reschedule keeps history (link to the previous appointment). Cancellation requires a reason; patient self-cancel respects the cancellation window (default 2 h, configurable).
- FR-APPT-09 (M) Calendar views: day, week, agenda; filter by doctor/department/room/status; color by status; click empty slot to book.
- FR-APPT-10 (M) Reminders (24 h and 2 h before, configurable) with confirm/cancel link.
- FR-APPT-11 (S) Waitlist for full days; auto-offer when a slot frees.
- FR-APPT-12 (M) Follow-up scheduling from within a consultation ("review in 7 days").
- FR-APPT-13 (S) No-show tracking; flag patients with repeated no-shows (visible to staff only).

### 6.5 Queue / token system (QUEUE)
- FR-QUEUE-01 (M) Token per doctor per day, generated at check-in. States: `WAITING > CALLED > IN_CONSULTATION > DONE`, plus `SKIPPED`.
- FR-QUEUE-02 (M) Priority classes (Emergency, Senior, Pregnant, Normal) affect ordering with explicit, visible rules.
- FR-QUEUE-03 (M) Doctor "Call next" / "Recall" / "Skip". Estimated wait time = average consult duration x patients ahead.
- FR-QUEUE-04 (M) Public **Queue Display Board** page (large text, high contrast, chime on new call) that updates in real time (SSE) without login via a device token.

### 6.6 Clinical records (EMR)
- FR-EMR-01 (M) Encounter created at check-in; holds vitals, notes, diagnoses, orders.
- FR-EMR-02 (M) Vitals (nurse or doctor): BP, pulse, temperature, respiratory rate, SpO2, height, weight, BMI (auto), pain score, blood glucose. Out-of-range values are highlighted using configurable ranges.
- FR-EMR-03 (M) SOAP note fields: chief complaint, history of present illness, examination, assessment, plan, advice, follow-up date. Specialty templates and doctor-defined snippets.
- FR-EMR-04 (M) Diagnoses via ICD-10 search (seeded dataset); primary + secondary.
- FR-EMR-05 (M) Autosave draft every 5 s; never lose typed text (also local recovery if the network drops).
- FR-EMR-06 (M) **Sign & lock** the encounter. After locking, changes are only possible as **addenda** (reason + author + time). Original is preserved.
- FR-EMR-07 (M) Orders from the consult screen: lab tests, prescription, referral, procedure.
- FR-EMR-08 (M) Generate PDFs: prescription, referral letter, medical certificate, sick note, visit summary, all on clinic letterhead with doctor signature.
- FR-EMR-09 (M) Previous-visit quick view side panel and vitals trend chart.
- FR-EMR-10 (M) Allergy banner always visible on every clinical screen for that patient.

### 6.7 Prescriptions (RX)
- FR-RX-01 (M) Medicine catalog: generic name, brand, form, strength, route, controlled class, default dose text, linked inventory item.
- FR-RX-02 (M) Prescription items: dose, frequency (OD/BD/TDS/QID/SOS/custom), duration, timing (before/after food), instructions, quantity (auto-calculated, editable).
- FR-RX-03 (M) Safety checks: allergy conflict (blocks; override needs reason + audit), duplicate ingredient warning, basic interaction check (seeded local table behind a provider interface).
- FR-RX-04 (M) Per-doctor favorites and prescription templates; "repeat previous prescription".
- FR-RX-05 (M) Statuses: `DRAFT > ISSUED > PARTIALLY_DISPENSED > DISPENSED`, or `CANCELLED`. Issued prescriptions are immutable (cancel + reissue).
- FR-RX-06 (M) Controlled-class drugs are flagged and require doctor registration number on the printout.

### 6.8 Laboratory (LAB)
- FR-LAB-01 (M) Test catalog: code, name, category, sample type, turnaround time, price, and parameters with units and reference ranges by sex and age band. Panels (groups of tests).
- FR-LAB-02 (M) Orders from consult or front desk (walk-in lab). Statuses: `ORDERED > SAMPLE_COLLECTED > IN_PROCESS > RESULTED > VERIFIED`, or `CANCELLED`.
- FR-LAB-03 (M) Sample collection with barcode/QR label PDF.
- FR-LAB-04 (M) Result entry per parameter; auto abnormal/critical flags; two-step verification (entered by tech, verified by authorized user).
- FR-LAB-05 (M) Report PDF; attach external report files.
- FR-LAB-06 (M) Result trend per patient per parameter (chart).
- FR-LAB-07 (M) Patient is notified when a report is verified and released.

### 6.9 Pharmacy and inventory (INV)
- FR-INV-01 (M) Items (medicine/consumable) with batches: batch no, expiry, purchase price, MRP/sale price, quantity, branch.
- FR-INV-02 (M) Suppliers; Purchase Orders `DRAFT > ORDERED > PARTIALLY_RECEIVED > RECEIVED`, or `CANCELLED`; Goods Receipt creates batches.
- FR-INV-03 (M) **Immutable stock ledger**: every change is a movement (RECEIPT, DISPENSE, RETURN, ADJUSTMENT, EXPIRY_WRITE_OFF, TRANSFER). Stock on hand is derived/validated from the ledger.
- FR-INV-04 (M) **FEFO** (first-expiry-first-out) batch selection when dispensing; expired batches cannot be dispensed.
- FR-INV-05 (M) Dispense against a prescription (partial allowed) or counter sale; both create billing lines.
- FR-INV-06 (M) Low-stock and expiry alerts (90/30 days) via dashboard + notification.
- FR-INV-07 (M) Adjustments require reason + permission and are audited.
- FR-INV-08 (S) Inter-branch stock transfer.
- FR-INV-09 (M) Stock valuation and movement reports.

### 6.10 Billing and payments (BILL)
- FR-BILL-01 (M) Service catalog with price and tax category; branch-specific price overrides.
- FR-BILL-02 (M) Invoice builder that auto-suggests items from the encounter (consult fee, procedures), lab orders and dispensed medicines; manual lines allowed.
- FR-BILL-03 (M) Line and invoice discounts (percentage or amount) with a role-based max % and reason.
- FR-BILL-04 (M) Tax per line (inclusive or exclusive, configurable), rounding rule configurable. **All money stored as integer minor units.**
- FR-BILL-05 (M) Invoice numbering per branch per fiscal year, gap-free for ISSUED invoices.
- FR-BILL-06 (M) Statuses `DRAFT > ISSUED > PARTIALLY_PAID > PAID`, or `VOID`. **ISSUED invoices are immutable**; corrections via credit note.
- FR-BILL-07 (M) Payments: cash, card (recorded), bank transfer, wallet/UPI-type (recorded), online gateway; split payments; partial payments; patient advance/deposit balance.
- FR-BILL-08 (M) Refunds with reason and approval workflow; credit notes.
- FR-BILL-09 (M) Receipt + invoice PDFs; share by email/WhatsApp link.
- FR-BILL-10 (M) Outstanding dues list with aging buckets.
- FR-BILL-11 (M) Cash register shifts: open, close, expected vs counted, variance report.
- FR-BILL-12 (M) Online payment through a `PaymentProvider` interface (implement one gateway in test mode; webhook-driven, idempotent).
- FR-BILL-13 (S) Insurance: split bill into patient share and insurer share; claim record with status (SUBMITTED, APPROVED, REJECTED, SETTLED) and attachments.

### 6.11 Patient portal (PORTAL)
- FR-PORTAL-01 (M) Sign-up with email/phone verification; link to an existing patient record only after identity verification (OTP to registered phone/email + DOB).
- FR-PORTAL-02 (M) Dependents/family members under one account.
- FR-PORTAL-03 (M) Book/reschedule/cancel appointments; see upcoming and past.
- FR-PORTAL-04 (M) View released visit summaries, prescriptions (PDF), lab reports (only when verified and released), invoices, and pay online.
- FR-PORTAL-05 (M) Manage profile, consents, and notification preferences.
- FR-PORTAL-06 (M) "Contact the clinic" form (creates an inbox item for staff).

### 6.12 Public website (SITE)
- FR-SITE-01 (M) Pages: Home, About, Services/Departments (from DB), Doctors list + profile (only doctors flagged public), FAQs, Contact, Book Appointment, Privacy Policy, Terms.
- FR-SITE-02 (M) Content is editable by admin from Settings (hero text, about, FAQs, opening hours, contact, social links) without deploys.
- FR-SITE-03 (M) SEO: metadata, Open Graph, JSON-LD (`MedicalClinic`, `Physician`), `sitemap.xml`, `robots.txt`, semantic HTML, fast LCP.
- FR-SITE-04 (M) Online booking wizard: choose service/department > doctor (or "any") > date/slot > patient details > OTP verify > confirmation with calendar (.ics) download. Rate-limited and bot-protected.

### 6.13 Notifications (NOTIF)
| Event | Channels | Recipient |
|---|---|---|
| Appointment booked / rescheduled / cancelled | Email, SMS/WhatsApp, in-app | Patient, Doctor |
| Appointment reminder (24 h, 2 h) | Email, SMS/WhatsApp | Patient |
| Lab report released | Email, SMS/WhatsApp | Patient |
| Invoice issued / payment received / refund | Email | Patient |
| Low stock / near expiry | In-app, email | Pharmacist, Admin |
| Password reset / invitation / OTP | Email, SMS | User |
| Critical lab value | In-app (urgent) | Ordering doctor |
- FR-NOTIF-01 (M) Templates with variables, per-channel, editable in Settings, with preview.
- FR-NOTIF-02 (M) Delivery through background jobs with retries, dead-letter queue, delivery status log.
- FR-NOTIF-03 (M) Users can set channel preferences (transactional messages that are legally/operationally required cannot be disabled).
- FR-NOTIF-04 (M) In-app notification bell with unread count, real-time via SSE.

### 6.14 Reports and dashboards (REP)
- FR-REP-01 (M) Role-specific dashboards (see Design.md).
- FR-REP-02 (M) Reports with date range + branch filters, and CSV/XLSX/PDF export: daily collection; revenue by service, doctor, department; outstanding/aging; appointments (status mix, no-show rate, average wait); new vs returning patients and demographics; top diagnoses; lab volume and TAT; inventory valuation, expiry, movement; cash register variance.
- FR-REP-03 (C) Scheduled weekly email report to Owner.

### 6.15 Audit, privacy and settings (AUD / SET)
- FR-AUD-01 (M) Append-only audit log: actor, role, action, entity, entity id, before/after (sensitive diffs), IP, user agent, reason (when required), timestamp.
- FR-AUD-02 (M) Audit viewer with filters and export (Owner/Admin only).
- FR-AUD-03 (M) Patient data export (JSON + PDF) and anonymization workflow, subject to retention rules.
- FR-SET-01 (M) Settings: clinic profile, logo/letterhead, timezone, currency, locale, tax categories, numbering formats, working hours, holidays, cancellation policy, vital ranges, payment methods, notification templates, feature flags.

## 7. Key user journeys (each must work end-to-end and have an E2E test)
1. **Walk-in new patient:** Receptionist searches (no match) > registers > walk-in appointment + token > nurse records vitals > doctor calls next > consultation > prescription + lab order > invoice created from encounter > payment > receipt printed.
2. **Online booking:** Visitor on public site > picks doctor/slot > verifies OTP > gets confirmation email + reminder > checks in at the clinic.
3. **Consultation to pharmacy:** Doctor issues prescription > Pharmacist opens it > dispenses with FEFO batches > invoice lines added > stock ledger updated.
4. **Lab flow:** Doctor orders > Lab tech collects sample (label) > enters results > lead verifies > report released > patient notified > visible in portal.
5. **Refund:** Accountant issues a credit note with approval > refund payment recorded > cash register reflects it > audit entries exist.
6. **Reschedule:** Receptionist drags/reschedules > conflict is prevented > patient notified > history retained.
7. **Locked note addendum:** Doctor signs a note > later adds an addendum with reason > the original remains visible.

## 8. Business rules (BR)
- BR-01 MRN is immutable and never reused, even after a merge or archive.
- BR-02 A patient under 18 needs a guardian; portal access for minors goes through the guardian.
- BR-03 A doctor cannot have two non-cancelled appointments that overlap (DB-enforced).
- BR-04 Cancelling within the cancellation window is blocked for patients but allowed for staff with a reason.
- BR-05 A signed encounter cannot be edited; only addenda are allowed.
- BR-06 An issued prescription cannot be edited; cancel and reissue.
- BR-07 An issued invoice cannot be edited; use a credit note or void (void allowed only if no payments).
- BR-08 Invoice numbers are sequential with no gaps per branch and fiscal year.
- BR-09 Dispensing uses FEFO; expired stock is never dispensable; negative stock is never allowed.
- BR-10 Stock ledger entries are never updated or deleted; corrections are new movements.
- BR-11 Allergy conflicts block issuing a prescription unless a doctor overrides with a reason (audited).
- BR-12 Lab results are visible to the patient only after verification and release.
- BR-13 Discounts above the role's max % need an approver.
- BR-14 Users are never hard-deleted; deactivate them. Patients are archived, not deleted; hard deletion is only through the retention/anonymization workflow.
- BR-15 Every write to clinical, billing, stock or permission data creates an audit entry.
- BR-16 All timestamps stored in UTC; displayed in the clinic's timezone.
- BR-17 Refund amount cannot exceed the amount paid for that invoice minus prior refunds.
- BR-18 Restricted/VIP patient charts require a break-glass reason each session.

## 9. Non-functional requirements
- **Performance:** p95 < 300 ms for list/search; page TTI < 2.5 s on a mid-range laptop; public pages LCP < 2.5 s.
- **Reliability:** graceful degradation if Redis/mail/SMS is down (queue retries); DB transactions on multi-table writes; idempotency on payments and webhooks.
- **Security:** OWASP ASVS L2 mindset; see Architecture section on security.
- **Privacy:** privacy-by-design. Data minimization; encryption in transit (TLS) and at rest (DB/volume + field-level for national ID). The system must be *configurable to support* HIPAA-style safeguards and GDPR/local data-protection laws. This is engineering support, not a legal certification; a legal review is required before real patient use.
- **Accessibility:** WCAG 2.2 AA; full keyboard operation; screen-reader labels.
- **Browser support:** last 2 versions of Chrome, Edge, Firefox, Safari; mobile Safari/Chrome for portal and public site.
- **Internationalization-ready:** all strings via i18n keys (English shipped); locale-aware dates, numbers, currency.
- **Backup/Recovery:** documented daily backups, RPO <= 24 h, RTO <= 4 h; restore tested once in Tasks.
- **Observability:** structured logs with request IDs, health/readiness endpoints, error tracking hook.

## 10. Release plan
Phases are defined in Tasks.md and executed in order; each milestone is reached at the end of the listed phases.
- **Milestone A (Foundation + Access):** Phases 0 to 1.
- **Milestone B (Front desk MVP):** Phases 2 to 3. Registration, appointments, queue.
- **Milestone C (Clinical + Lab + Pharmacy):** Phases 4 to 6. Consultation, prescriptions, lab, inventory.
- **Milestone D (Money + Communication):** Phases 7 to 8. Billing, payments, refunds, notifications.
- **Milestone E (Patient-facing):** Phase 9. Public website, online booking, portal.
- **Milestone F (Production-ready):** Phases 10 to 11. Reports, audit, hardening, docs, deployment.

## 11. Assumptions and risks
- Currency, timezone, tax and locale are **configurable** (defaults: USD, UTC, no tax) and never hard-coded.
- SMS/WhatsApp use a provider interface; the local default is a **console/file logger driver** so the system runs without paid accounts.
- Drug-interaction data is a small seeded dataset behind an interface; clinics must supply/licence a full dataset for real use. Say so in the UI and docs.
- ICD-10 dataset is seeded from an open list; verify licence/attribution and document it.
- Risk: scope size. Mitigation: strict phase gates and Definition of Done.

## 12. Glossary
MRN (medical record number) · EMR (electronic medical record) · Encounter (one clinical visit) · SOAP (Subjective, Objective, Assessment, Plan) · FEFO (first-expiry-first-out) · GRN (goods receipt note) · PHI (protected health information) · RBAC (role-based access control) · TAT (turnaround time) · ADR (architecture decision record).
