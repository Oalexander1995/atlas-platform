# Atlas Platform — Project Assumptions

This document records architectural decisions and assumptions made during implementation, in accordance with Section 0.1 (Rule 7) and Section 13 of `Atlas_PRD.md`.

---

## Milestone 1 Assumptions & Decisions

### 1. Database Engine: PostgreSQL via PGlite
- **PRD Reference:** Section 8, Section 13 ("Database: PostgreSQL (local via Docker Compose)... Use this unless there is a strong reason not to (record any change in ASSUMPTIONS.md)").
- **Context:** The host environment lacks Docker Desktop and system-level PostgreSQL, and root/sudo permissions are restricted.
- **Decision:** We use `@electric-sql/pglite` (official PostgreSQL 16 compiled to WebAssembly running in-process with Node.js) with disk persistence at `./data/postgres`. PGlite executes true PostgreSQL SQL, supporting Postgres types (`BIGINT`, `TIMESTAMPTZ`, `JSONB`, `UUID`), transactions, deferred constraint triggers, and row locks without requiring a background Docker daemon. If a remote/local PostgreSQL server is later provided via `DATABASE_URL`, the database client can toggle seamlessly.

### 2. Authentication & Session Architecture
- **PRD Reference:** Section 9, Section 12, Section 13.
- **Decision:** Authenticated sessions use HTTP-only, SameSite=Lax signed session tokens (JWT via `jose` library) stored in a secure cookie named `atlas_session`. Passwords are hashed using `bcryptjs` with standard salt rounds.
- **Roles:** `investor`, `admin`, `compliance`.
- **Account States:** `pending_kyc`, `verified`, `restricted`, `closed`.

### 3. Unified Clock Service
- **PRD Reference:** Section 12 ("All 'now' logic goes through a single clock service so the admin fast-forward works everywhere"), Section 3.3, Section 3.4.
- **Decision:** A centralized `ClockService` (`src/lib/clock.ts`) manages simulated time. The time offset is persisted in the database (`system_settings`) so any time fast-forwarding triggered by an admin applies consistently across API handlers, server components, and background tasks.

### 4. Audit Log Service
- **PRD Reference:** Section 8.1, Section 12.
- **Decision:** An append-only `audit_log` table records actions (`actor_user_id`, `action`, `entity_type`, `entity_id`, `before`, `after`, `ip`, `created_at`). A dedicated helper `logAuditEvent` writes to this table within transactions where applicable, automatically redacting sensitive fields (e.g., `password_hash`).

### 5. Demo Banner
- **PRD Reference:** Section 0.1 (Rule 1).
- **Decision:** A persistent, non-dismissible banner displaying `DEMO — simulated money. No real investments are made.` is rendered at the top of the root Next.js layout (`src/app/layout.tsx`) on all routes.

### 6. Design System Basics
- **PRD Reference:** Section 7.1.
- **Decision:** Built with Tailwind CSS, supporting mobile-first viewports (down to 360px), accessible color contrast (WCAG 2.2 AA), clear typography (Inter / sans-serif), and distinct risk tier badge palettes (Low: teal, Medium: amber, High: deep orange, Uncharted: purple) paired with explicit text labels.

### 7. Copy Lint Enforcement
- **PRD Reference:** Section 0.1 (Rule 6), Section 14.3.
- **Decision:** A copy lint script (`scripts/lint-copy.js` and Vitest test `tests/copy-lint.test.ts`) verifies that banned terms ("guaranteed returns", "zero-failure", "risk-free", "lottery", "can't lose", "secure returns", and positive claims of "safe" / "guaranteed") are absent from application UI strings, while permitting required negative disclaimers ("not guaranteed", "not a guarantee").
