# ClinicOS — Complete Clinic Management System

**ClinicOS** is an all-in-one, web-based clinic management system for single-doctor clinics up to multi-specialty polyclinics.

- **Staff App:** Front desk registration, scheduling, EMR, prescriptions, lab, pharmacy, billing, and reports.
- **Patient Portal:** Appointments, medical history, e-prescriptions, lab reports, and billing.
- **Public Website:** Clinic information, doctor profiles, and online appointment booking.

## Tech Stack
- **Monorepo:** pnpm workspaces + Turborepo
- **Frontend:** Next.js (App Router), React, Tailwind CSS, shadcn/ui, TanStack Query
- **Backend:** NestJS (Express adapter), Zod, OpenAPI/Swagger
- **Database & Cache:** PostgreSQL 16+ (Prisma ORM), Redis, BullMQ
- **Infrastructure:** Docker Compose, Caddy, MinIO, Mailpit
