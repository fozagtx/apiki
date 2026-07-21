# Apiki

## Inspiration

API keys are easy to create and surprisingly hard to manage well. They end up in notes, chat messages, `.env` files, old dashboards, and forgotten accounts. Apiki started from a simple question: what would a calm, security-minded workspace look like if it treated API keys as living credentials instead of one-time setup strings?

## What it does

Apiki is a live encrypted API key workspace for developers and small teams. Users can create an encrypted workspace with a passphrase, add API key records, store secret values as ciphertext in Neon, and track the operational metadata around each key.

Apiki helps users manage:

- Encrypted API key storage
- Service, owner, environment, and documentation metadata
- Rotation intervals and overdue rotation checks
- Workspace dashboard metrics
- Status, cost, and usage-limit metadata
- Workspace monitoring rules for missing docs, inactive keys, overdue rotation, and high-cost records

The current build is intentionally honest about scope. It uses a live Neon database, but it does not pretend to provide provider validation, traffic analytics, billing, email alerts, or team collaboration.

## How we built it

We built Apiki as a Next.js, React, TypeScript, Prisma, and Neon app. The workspace uses the browser Web Crypto API to derive an AES-GCM encryption key from the user’s passphrase with PBKDF2. API key values are encrypted before they are sent to the API, so Neon stores ciphertext and metadata rather than plaintext secrets.

The UI is built with a shared primitive layer for buttons, cards, panels, fields, badges, banners, dialogs, and empty states. The visual system uses a Mouve-inspired premium product theme with pill CTAs, raised primary actions, and consistent card/icon treatment.

Core routes include:

- Public landing page
- Workspace create/unlock gate
- Dashboard
- API key inventory
- Rotation schedule
- Analytics
- Monitoring
- Settings

Protected app routes are gated until the encrypted workspace is unlocked.

## Challenges we ran into

The biggest challenge was resisting fake demo shortcuts. A product like this can easily look impressive with seeded keys, fake metrics, and pretend monitoring, but that would be the wrong trust model for a security tool. We kept the app empty until the user creates real workspace records.

Another challenge was connecting live storage without overstating the security model. Apiki encrypts secrets before persistence, but it does not claim to replace a production team secrets manager yet.

The UI also needed refinement. We moved away from scattered one-off components and built a consistent primitive system so the app feels like a coherent product instead of a collection of isolated screens.

## Accomplishments that we're proud of

We are proud that Apiki has a real encrypted workspace flow instead of a static mockup. Users can create a workspace, add encrypted key records, reveal and copy decrypted values after unlock, delete records, mark keys rotated, and review risk checks.

We are also proud of the honesty in the product. Empty states stay empty. Integration limitations are visible. The app does not invent traffic, alerts, integrations, or hosted activity.

Finally, the UI now has a reusable component foundation, which makes the product easier to extend without drifting into inconsistent patterns.

## What we learned

We learned that trust is as much a product-design problem as it is a technical problem. Encryption matters, but so do clear empty states, honest labels, route gates, and avoiding fake success.

We also learned that API key management is not only about storing secrets. The surrounding metadata matters: ownership, environment, docs, cost, status, and rotation policy are what make credentials maintainable over time.

## What's next for project

Next, Apiki could grow from a single-workspace key manager into a team-ready API key management platform.

Planned next steps include:

- Team workspaces and role-based access
- Provider integrations for real key validation
- Real usage and traffic analytics
- Webhook, email, and Slack alerts
- Audit logs
- Import/export workflows
- Browser extension support for safer credential capture
- Stronger recovery and backup options
