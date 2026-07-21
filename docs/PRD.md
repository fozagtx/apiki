# Apiki PRD

## Product

Apiki is a developer-focused API key management workspace. It helps solo builders and small teams store API keys, track metadata, plan rotations, monitor risk, and review usage/security analytics from real workspace records.

This implementation is a live Neon-backed MVP. It encrypts stored key values with a user passphrase using Web Crypto, then persists encrypted payloads and metadata through a Prisma API backed by Neon Postgres. It does not claim to provide production multi-user authentication, team RBAC, provider-side key validation, server-side traffic monitoring, email/webhook alerts, Stripe billing, or Supabase persistence.

## Non-Negotiables

- PRD before implementation.
- Public marketing route is separate from protected app routes.
- Protected routes show an auth/workspace gate until the passphrase unlocks the encrypted workspace.
- API key secrets are encrypted before storage.
- Neon Postgres is the source of truth for workspace records after setup.
- The database stores encrypted secret ciphertext and metadata, not decrypted API key values.
- No mocks, samples, fixtures, seeded workspaces, or fake preview data in the product UI.
- No fake provider alerts, emails, billing events, API traffic, hosted monitoring success, or placeholder API keys.

## Users And Roles

| Role | Description | Can | Cannot |
| --- | --- | --- | --- |
| Visitor | Not authenticated/unlocked | View landing page, start workspace setup, unlock existing workspace | View stored keys or protected app data |
| Workspace User | User with an unlocked encrypted workspace | Add, edit, reveal, copy, delete, rotate, filter, and monitor Neon-backed encrypted records | Send provider alerts, validate provider keys, manage RBAC |
| Admin/Operator | Not implemented in live MVP | N/A | Manage billing, hosted teams, RBAC, audit logs |

## Route Map And Permissions

| Route | Purpose | Visitor | Workspace User | Admin/Operator | Notes |
| --- | --- | --- | --- | --- | --- |
| `/` | Public landing and product overview | Allowed | Allowed | N/A | Public CTAs only. |
| `/login` | Create or unlock encrypted workspace | Allowed | Allowed | N/A | Creates/loads encrypted workspace through the live API. |
| `/dashboard` | Security posture and workspace overview | Blocked by workspace gate | Allowed | N/A | Shows metrics derived from Neon-backed records. |
| `/keys` | API key inventory and add-key workflow | Blocked by workspace gate | Allowed | N/A | Secrets encrypted before storage. |
| `/rotation` | Rotation schedule and due items | Blocked by workspace gate | Allowed | N/A | Rotation completion updates metadata. |
| `/analytics` | Workspace metadata analytics | Blocked by workspace gate | Allowed | N/A | No live API traffic is fabricated. |
| `/monitoring` | Workspace monitoring rules and risk checks | Blocked by workspace gate | Allowed | N/A | Hosted alerts marked unavailable. |
| `/settings` | Workspace settings and export/reset controls | Blocked by workspace gate | Allowed | N/A | Export excludes decrypted secrets. |

## Page Requirements

### Landing

- Purpose: Explain Apiki and route visitors to the workspace gate.
- Visible data: Product value proposition, capability areas, security workflow, and real live workspace state only.
- Allowed actions: Start live workspace, view protected app if already unlocked.
- Blocked actions: Direct secret management.
- Empty/loading/error states: N/A.

### Workspace Gate

- Purpose: Create or unlock the live encrypted workspace.
- Visible data: Current workspace state, security notes, and live database status.
- Allowed actions: Set up workspace, unlock workspace, clear passphrase input.
- Blocked actions: Access protected app without valid passphrase.
- Error state: Invalid passphrase, crypto failure, missing database configuration, or live API failure.

### Protected App Shell

- Purpose: Provide consistent sidebar/header navigation.
- Visible data: Workspace identity, route navigation, workspace lock status.
- Allowed actions: Navigate, lock workspace.
- Blocked actions: None after unlock.

### Dashboard

- Purpose: Summarize key count, active keys, rotation risk, security score, and alerts.
- Visible data: Metrics derived from Neon-backed encrypted records and metadata.
- Allowed actions: Add key, navigate to details.
- Empty state: Encourage first key creation.

### API Keys

- Purpose: Store and manage encrypted API key records.
- Visible data: Metadata, masked key status, environment, owner, rotation due date, monthly cost/limit.
- Allowed actions: Add, reveal, copy, rotate, delete, filter.
- Blocked actions: Provider validation or fake provider health checks.
- Error state: Decryption failure shown per key.

### Rotation

- Purpose: Identify stale or due keys and update rotation metadata.
- Visible data: Rotation interval, last rotated date, next due date, overdue status.
- Allowed actions: Mark rotated, edit interval via key edit flow.

### Analytics

- Purpose: Show distribution of keys by service, environment, status, and cost.
- Visible data: Metadata charts and summaries derived from records stored in Neon.
- Blocked actions: Fabricated traffic analytics.

### Monitoring

- Purpose: Surface workspace risk checks and unavailable hosted monitor integrations.
- Visible data: Checks for overdue rotation, missing docs, inactive/stale records, and exposed metadata.
- Allowed actions: Toggle workspace rule preferences.
- Blocked actions: Email/SMS/webhook alerts without provider integration.

### Settings

- Purpose: Manage workspace lock/export/reset.
- Visible data: Workspace metadata and storage status.
- Allowed actions: Lock, export metadata, reset live workspace.
- Blocked actions: Export decrypted API keys.

## UI System

- Component library: Project React primitives in `src/components/ui.tsx` with shadcn/HeroUI-style semantics for buttons, cards, action cards, panels, fields, banners, empty states, dialogs, tabs, tables, inputs, and alerts.
- Icons: `lucide-react`, routed through shared icon/button/card primitives instead of one-off icon wrappers.
- Navigation: Public top navigation plus protected sidebar shell.
- Forms: Native accessible form controls styled by the project CSS system.
- Tables/lists: Dense, scan-friendly operational tables.
- Toasts/errors: Inline status messages and compact banners.
- Visual restrictions: Restrained product UI, no decorative gradient/orb backgrounds, no nested cards, no oversized marketing-only shells in the app.

## Backend And Data

- Runtime: Next.js App Router with API route handlers under `src/app/api`.
- Database: Neon Postgres.
- ORM: Prisma.
- Source of truth: one live workspace envelope in Neon for the MVP.
- Storage model: workspace metadata, monitoring preferences, encrypted verifier, and encrypted key records.
- Secret handling: browser encrypts/decrypts API key values with Web Crypto; API receives and stores ciphertext only.
- Configuration: `DATABASE_URL` for application reads/writes and `DIRECT_URL` for Prisma schema operations.
- Honest limitation: production account auth and per-user authorization are not implemented yet, so the app remains passphrase-gated at the workspace layer.

## No Fake Demo Rules

Never allowed:

- Mock records, sample workspaces, seeded fixtures, fake dashboard numbers, or placeholder API keys.
- Fake hosted alerts, emails, webhooks, Stripe status, Supabase sync, provider validation, traffic collection, or production-looking success.
- Decrypted key export.

Only user-created live workspace records may populate dashboard, key, analytics, rotation, or monitoring data. Empty states must remain empty until the user creates records.

## Acceptance Criteria

- Public and protected routes are separated.
- Unauthorized users cannot view protected app content.
- Workspace setup and unlock work with a passphrase.
- API key secrets are encrypted before API/database storage.
- Neon Postgres persists workspace metadata and encrypted records through Prisma.
- Add/reveal/copy/delete/rotate flows work.
- Live database and unfinished provider-alert limitations are labeled.
- No mock/sample/fixture data appears anywhere in the product UI.
- Build/typecheck pass.
