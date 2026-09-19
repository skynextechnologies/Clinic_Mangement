# Design.md: ClinicOS Design System and UX Specification

## 1. Design intent
**Feel:** calm, trustworthy, clinical-but-warm. It should feel like a well-run modern clinic, not a legacy hospital ERP and not a generic SaaS template.
**Principles**
1. **Clarity over decoration.** Medical staff scan under pressure. High legibility, obvious hierarchy, generous whitespace in the patient-facing pages, dense-but-calm in staff tables.
2. **Safety is visible.** Allergies, patient identity and irreversible actions are always unmistakable.
3. **Fast by default.** Keyboard-first front desk: global search (`Ctrl/Cmd+K`), shortcuts, autofocus, minimal clicks, optimistic UI where safe.
4. **One system, three faces.** Staff app (dense/productive), patient portal (friendly/reassuring), public website (welcoming/premium). Same tokens, different density.
5. **Consistent and boring where it matters.** Same patterns for tables, forms, dialogs, empty states everywhere.
6. **Accessible always.** WCAG 2.2 AA minimum.

## 2. Brand and identity
- Product name from a single constant (`PRODUCT_NAME`). Logo: simple wordmark + a minimal abstract mark (a soft rounded cross/heartbeat line in SVG). Provide the SVG in `apps/web/public/brand/`. Clinic logo (uploaded in Settings) replaces the mark in portal/public/PDFs.
- Voice: warm, plain-language, respectful, never jargon in patient-facing copy. No emojis in the staff app UI; a sparing friendly tone in the portal/public site.

## 3. Design tokens
Implement as CSS variables in `styles/tokens.css`, mapped into Tailwind theme. shadcn-compatible HSL variables. **Do not use raw hex in components.**

### 3.1 Color (light)
```
--background: 180 20% 98%;      --foreground: 190 30% 10%;
--card: 0 0% 100%;              --card-foreground: 190 30% 10%;
--popover: 0 0% 100%;           --popover-foreground: 190 30% 10%;
--primary: 178 78% 27%;         --primary-foreground: 0 0% 100%;      /* Clinic Teal */
--secondary: 180 18% 94%;       --secondary-foreground: 190 30% 14%;
--muted: 180 14% 94%;           --muted-foreground: 190 10% 38%;
--accent: 178 40% 92%;          --accent-foreground: 178 78% 20%;
--highlight: 12 86% 60%;        --highlight-foreground: 0 0% 100%;    /* Warm Coral: sparing accent, CTAs on public site, badges */
--destructive: 0 72% 45%;       --destructive-foreground: 0 0% 100%;
--success: 142 64% 30%;         --warning: 32 92% 40%;   --info: 214 80% 42%;
--border: 180 14% 88%;          --input: 180 14% 88%;    --ring: 178 78% 27%;
--radius: 0.625rem;
```
### 3.2 Color (dark)
```
--background: 190 35% 6%;       --foreground: 180 15% 94%;
--card: 190 30% 9%;             --popover: 190 30% 9%;
--primary: 175 65% 45%;         --primary-foreground: 190 35% 6%;
--secondary: 190 22% 14%;       --muted: 190 20% 14%;    --muted-foreground: 185 10% 65%;
--accent: 178 30% 16%;          --accent-foreground: 175 65% 75%;
--destructive: 0 65% 55%;       --border: 190 18% 18%;   --input: 190 18% 18%;   --ring: 175 65% 45%;
--success: 142 55% 50%;         --warning: 38 92% 55%;   --info: 214 85% 65%;
```
Verify every foreground/background pair reaches >= 4.5:1 (text) and >= 3:1 (UI boundaries) with a contrast checker; adjust tokens (not components) if any fails.

### 3.3 Status color mapping (badges, calendar, table chips): always icon + text + color, never color alone
| Domain | Status > token |
|---|---|
| Appointment | SCHEDULED > info · CONFIRMED > primary · CHECKED_IN > warning · IN_CONSULTATION > highlight · COMPLETED > success · CANCELLED > muted (strikethrough) · NO_SHOW > destructive |
| Invoice | DRAFT > muted · ISSUED > info · PARTIALLY_PAID > warning · PAID > success · VOID > destructive |
| Lab | ORDERED > muted · SAMPLE_COLLECTED > info · IN_PROCESS > warning · RESULTED > highlight · VERIFIED > success |
| Stock | OK > success · LOW > warning · OUT/EXPIRED > destructive · NEAR_EXPIRY > warning |
| Lab flags | NORMAL > success · LOW/HIGH > warning · CRITICAL > destructive (bold + icon) |

### 3.4 Typography
- **Headings/display:** `Plus Jakarta Sans` (600/700). **Body/UI:** `Inter` (400/500/600). **Mono (IDs, MRN, codes):** `JetBrains Mono` (`tabular-nums` for numbers). Load with `next/font` (self-hosted, `display: swap`), provide system fallbacks.
- Scale (rem, line-height): `xs .75/1.1` · `sm .875/1.35` · `base 1/1.55` · `lg 1.125/1.5` · `xl 1.25/1.4` · `2xl 1.5/1.3` · `3xl 1.875/1.25` · `4xl 2.25/1.15` · `5xl 3/1.1` (public hero only).
- Staff app default text is `sm` (14px) for density; forms and portal use `base`. Tables use `sm` with `tabular-nums` on numeric columns, right-aligned.

### 3.5 Spacing, radius, elevation, motion
- 4px base grid. Common: 4, 8, 12, 16, 24, 32, 48, 64. Page gutters: 16 (mobile) / 24 (tablet) / 32 (desktop). Max content width: 1440 staff app, 1200 public/portal.
- Radius: `sm 6px`, `md 10px (default)`, `lg 14px`, `xl 20px`, `full` for avatars/pills.
- Shadows (subtle, cool-tinted): `sm` (cards), `md` (popovers, dropdowns), `lg` (dialogs). Prefer 1px borders over heavy shadows in the staff app.
- Motion: durations `120ms` (hover/focus), `200ms` (menus, tabs), `320ms` (dialogs, drawers, page-level); easing `cubic-bezier(0.2, 0, 0, 1)`. Respect `prefers-reduced-motion` (no transforms, keep opacity fades <= 120ms). No decorative looping animation in the staff app.
- Iconography: **lucide-react**, 16/20/24px, stroke 1.75, always with accessible names when standalone.

## 4. Layout system

### 4.1 Staff app shell (`(app)`)
- **Left sidebar** (collapsible, 264px expanded / 72px collapsed; drawer on mobile): logo, branch switcher (if multi-branch), navigation grouped and permission-filtered:
  *Overview* (Dashboard) · *Front desk* (Patients, Appointments, Queue) · *Clinical* (Consultations, Prescriptions, Lab) · *Pharmacy* (Dispensing, Inventory, Suppliers, Purchase Orders) · *Billing* (Invoices, Payments, Cash Register, Claims) · *Insights* (Reports) · *Admin* (Staff, Services, Settings, Audit).
- **Top bar:** breadcrumbs, global command palette trigger (search patients/appointments/invoices/actions), quick "+ New" menu (Patient, Appointment, Walk-in, Invoice), notifications bell (SSE), theme toggle, user menu (profile, sessions, sign out).
- **Content area:** page header (title, subtitle, primary action on the right), optional tabs, then content. Sticky action bar for long forms.
- **Patient context bar** (clinical screens only): sticky under the top bar: avatar, name, age/sex, MRN (mono), phone, **allergy banner** (destructive-tinted, always visible, "No known allergies" shown in neutral if none recorded/verified), VIP flag, insurance chip.

### 4.2 Responsive rules
Breakpoints: `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`. Staff app is optimized for >= 1024 (desktop/laptop) and **fully usable** on tablet (768) for nurse/doctor rounds; mobile (375) supports essential flows (queue, patient lookup, appointment view, payment). Portal and public site are **mobile-first**.

### 4.3 Grid and density
12-col grid on content pages; card grids `1/2/3/4` by breakpoint. Table density toggle (comfortable/compact) saved per user.

## 5. Component inventory (build once, reuse everywhere)
**Primitives (shadcn/ui):** Button (primary, secondary, outline, ghost, destructive, link; sizes sm/md/lg/icon), Input, Textarea, Select, Combobox (async search), Checkbox, Radio, Switch, DatePicker, DateRangePicker, TimePicker, Slider, Tabs, Accordion, Dialog, AlertDialog, Sheet/Drawer, Popover, Tooltip, DropdownMenu, ContextMenu, Command (palette), Toast (sonner), Avatar, Badge, Card, Separator, Skeleton, Progress, Table, Pagination, Breadcrumb, Calendar.

**Patterns (compose the primitives):**
- `PageHeader`, `DataTable` (server-side pagination/sort/filter, column visibility, density, row selection, export, saved views), `FilterBar`, `EmptyState` (icon + title + hint + primary action), `ErrorState` (message + retry + request id), `LoadingSkeletons`, `StatusBadge` (mapping from 3.3), `ConfirmDialog` (states consequences, typed confirmation for critical actions like void/anonymize), `FormSection`, `FieldRow`, `PhoneInput`, `MoneyInput`/`MoneyText` (locale/currency aware, tabular), `PatientPicker` (async, MRN/phone search, "Register new" inline), `DoctorPicker`, `SlotPicker`, `AllergyBanner`, `PatientContextBar`, `VitalsForm` (with range highlighting), `RichNoteEditor` (lightweight structured fields + snippets; sanitized), `Timeline`, `KPI Card` (value, delta, sparkline), `Chart` wrappers (line, bar, donut with accessible tables), `FileUploader` (drag/drop, progress, validation), `PdfPreviewDialog`, `Stepper` (wizards), `KeyboardShortcutsDialog`, `NotificationBell`, `BranchSwitcher`, `PermissionGate (<Can/>)`, `SessionTimeoutDialog`.

**Component states required:** default, hover, focus-visible (2px ring + offset), active, disabled, loading, error, success. Provide a `/dev/design-system` page (dev only) that renders every component and state, used for visual QA.

## 6. Page inventory and layout notes

### 6.1 Auth
Login (split layout: left brand panel with calm illustration/pattern and one reassuring line, right form), Forgot/Reset, 2FA challenge, Accept invitation, Session-expired modal. Errors are generic ("Email or password is incorrect"). Show caps-lock hint, show/hide password, "Remember this device" only if allowed by policy.

### 6.2 Dashboards (role-specific; each KPI links to its filtered list)
- **Owner/Admin:** today's revenue vs 7-day avg, appointments today (by status), new patients, outstanding dues, low-stock/expiry alerts, doctor utilization, revenue trend (30 d), top services, no-show rate.
- **Doctor:** my queue now (next patient card with "Call next"), today's schedule timeline, pending lab results to review, unsigned notes.
- **Nurse:** patients waiting for vitals, tasks (sample collection), queue.
- **Receptionist:** today's appointments board, walk-in quick action, check-in list, unpaid invoices today, waitlist offers.
- **Pharmacist:** prescriptions awaiting dispensing, low stock, expiring soon, recent movements.
- **Lab tech:** samples to collect, in process, awaiting verification, critical values.
- **Accountant:** collections by method today, outstanding aging, refund approvals pending, cash shift status.

### 6.3 Patients
- **List:** search bar autofocus, filters (sex, age range, branch, has dues, VIP, archived), table columns: MRN, name (+avatar), age/sex, phone, last visit, next appointment, dues. Row click opens profile. "+ Register patient" primary.
- **Register:** multi-step wizard or single long form with sticky section nav (Identity, Contact, Emergency/Guardian, Medical basics, Insurance, Consents). Live duplicate check panel appears on the right after name+DOB or phone entered.
- **Profile:** header (context bar) + tabs: Overview (summary cards: vitals trend, active problems, allergies, upcoming appointments, dues), Timeline, Encounters, Prescriptions, Lab, Billing, Documents, Insurance, Consents, Audit (permissioned).

### 6.4 Appointments
- **Calendar page:** left mini-calendar + filters (doctor, department, room, status); main area day/week/agenda; doctor columns in day view; events colored by status with icon; click empty slot > booking drawer; drag to reschedule (with conflict feedback and undo toast); today's line marker; off-hours shaded; leave/holiday hatched.
- **Booking drawer:** patient picker > type > doctor > date > slot chips (available only) > reason > notify toggle > confirm. Shows fee.
- **Walk-in:** one compact dialog (patient, doctor, priority) that creates appointment + token and prints/shows token.

### 6.5 Queue
- **Staff queue page:** columns by state (Waiting, Called, In consultation, Done) per doctor with token cards (number, name, priority chip, wait time). Actions: Call, Recall, Skip, Done.
- **Display board (`/display/queue`)**: full-screen, very large type (token numbers >= 96px), high contrast (dark theme forced), doctor/room name, "Now calling" section with chime and visual flash (reduced-motion safe), next 5 waiting tokens (masked names: first name + initial only). No PHI beyond that; auto-reconnect indicator.

### 6.6 Consultation workspace (most important screen; design with care)
Three-zone layout (desktop):
- **Left (300px, collapsible):** patient summary: allergies, chronic conditions, last 3 visits, vitals trend mini-chart, active medications, recent labs.
- **Center (flex):** tabs/sections in one scrolling column with sticky section nav: Vitals · Complaint & History · Examination · Assessment & Diagnoses (ICD-10 combobox) · Plan & Advice · Follow-up. Autosave indicator ("Saved 2 s ago") in the header.
- **Right (340px, collapsible):** Orders panel: Prescription builder (medicine combobox, dose/frequency/duration chips, safety alerts inline), Lab orders picker, Referral, Documents. 
- **Footer bar (sticky):** Save draft · Preview · **Sign & lock** (primary, confirmation dialog listing what will be locked).
On tablets: right panel becomes a bottom sheet; left panel becomes a drawer. After signing: read-only view with "Add addendum".

### 6.7 Prescriptions / Pharmacy / Lab
- Prescription view (print-styled preview identical to the PDF). Pharmacist dispensing screen: Rx items on the left, batch selection (auto-FEFO with override reason) on the right, running totals, "Dispense & add to bill".
- Inventory: table with stock chips, batch drawer, movement history, adjust dialog (reason required). PO builder with supplier selection, line items, receiving flow that captures batch/expiry.
- Lab: worklist tabs by status, sample collection with label print, result entry grid (parameter, value, unit, ref range, flag auto-computed), verification screen with diff highlights for abnormal values, trend sparkline per parameter.

### 6.8 Billing
- Invoice builder: patient context on top, line items table (inline edit, add from catalog with search, auto-suggested items panel from encounter/lab/dispense), discount control (with approval hint), totals card (subtotal, discount, tax, total, paid, due) pinned on the right; actions: Save draft, Issue, Take payment.
- Payment dialog: method tabs (Cash, Card, Bank, Wallet/UPI-type, Online link), split rows, change due calculation for cash, wallet balance use, confirm > receipt preview/print.
- Cash register: open/close shift dialogs, expected vs counted with variance highlighting.
- Refund flow: request > approval queue > paid, with an audit trail panel.

### 6.9 Reports, Settings, Audit
Reports: filter bar (date range presets, branch), summary KPIs, chart + table, export menu (CSV/XLSX/PDF). Settings: left nav sections (Clinic, Branches, Hours & holidays, Tax, Numbering, Notifications templates with live preview, Website content, Security policy, Payment methods, Integrations). Audit: filterable table + detail drawer with before/after diff.

### 6.10 Patient portal (mobile-first, friendly)
Bottom tab bar on mobile (Home, Appointments, Records, Bills, Profile); top nav on desktop. Home: next appointment card, quick "Book appointment", latest prescription, unpaid bill callout. Booking flow is a stepper with big touch targets. Records pages use clear cards with download buttons. Family switcher in the header for dependents.

### 6.11 Public website (premium, welcoming, fast)
- **Visual direction:** airy, light backgrounds, teal primary with coral accent CTAs, large Plus Jakarta Sans headlines, soft rounded cards, subtle section transitions. Photography slots for the clinic and doctors are supplied by the clinic via Settings; provide tasteful abstract vector placeholders (never stock-fake people, never fake testimonials/awards/numbers).
- **Home:** hero (headline + subhead + "Book appointment" primary + "Call us" secondary + opening-hours chip), trust row (services count, doctors, opening hours: from real data only), services grid, featured doctors carousel/grid, "How it works" 3 steps, FAQ accordion, contact/map block, footer with hours, address, links.
- **Doctors page:** filter by department; profile cards with photo, name, specialty, qualifications, "Book" button. **Doctor profile:** bio, qualifications, departments, available next slots (real), book CTA.
- **Booking wizard:** progress stepper, sticky summary, clear errors, OTP step with resend timer, confirmation with `.ics` download and "Add to calendar".
- Sticky header with transparent-to-solid transition, mobile hamburger sheet, sticky mobile "Book" button. JSON-LD and OG metadata on every page. Cookie/consent banner only if analytics are enabled.

## 7. Interaction and UX patterns
- **Global search / command palette (`Ctrl/Cmd+K`):** patients (name/MRN/phone), appointments, invoices, actions ("New patient", "Walk-in", "Take payment"). Recent items. Results grouped, keyboard navigable.
- **Keyboard shortcuts** (shown in a `?` dialog): `g p` patients, `g a` appointments, `g q` queue, `n p` new patient, `n a` new appointment, `/` focus search, `Esc` close, `Ctrl+S` save draft (clinical).
- **Feedback:** toast for success (auto-dismiss 4 s), inline for validation, banners for system-level issues (offline, session expiring). Optimistic updates only for reversible, low-risk actions, with undo.
- **Destructive/irreversible actions:** confirm dialog with explicit consequence text; critical actions (void invoice, anonymize patient, merge patients) require typing a confirmation word.
- **Offline/poor network:** connection banner; clinical note autosave falls back to local recovery; queue display shows "Reconnecting...".
- **Loading:** skeletons matching final layout; never block the entire screen with a spinner for partial data; buttons show spinners on submit.
- **Empty states:** friendly, specific, with a primary next action (e.g., "No appointments today. Book one.").
- **Errors:** human wording, what happened + what to do next + request id in a collapsible detail.
- **Unsaved changes:** route-leave guard on dirty forms.
- **Print:** dedicated print stylesheets for token slips, prescriptions, invoices, receipts, and lab reports (A4/Letter configurable, no app chrome).

## 8. Accessibility checklist (per screen)
Semantic landmarks (`header`, `nav`, `main`, `footer`) · one `h1` per page · labels programmatically associated · errors linked via `aria-describedby` and announced (`aria-live="polite"`) · focus trapped in dialogs and returned on close · logical tab order · visible focus ring · no keyboard traps in calendar/table · charts have text/table alternatives · status never conveyed by color alone · zoom to 200% without loss · touch targets >= 44px · reduced motion respected · language attribute set · skip-to-content link.

## 9. Content and microcopy
- Buttons use verbs ("Book appointment", "Issue invoice", "Sign and lock note"). Avoid "Submit"/"OK".
- Confirmation copy states consequences: "Signing locks this note. You can still add an addendum."
- Errors: "We couldn't book that slot because it was just taken. Here are the nearest times."
- Patient-facing language avoids jargon; clinical staff screens may use standard medical abbreviations.
- Dates: locale-aware, unambiguous format ("20 Sep 2026, 4:30 PM"); relative time only as a tooltip supplement.

## 10. Design QA gates (per phase)
- Screenshots at 375/768/1280 for every new page, light and dark.
- Contrast and keyboard pass logged in Memory.md.
- Lighthouse (public pages): Performance, Accessibility, Best Practices, SEO >= 90.
- Visual consistency check against `/dev/design-system`.
