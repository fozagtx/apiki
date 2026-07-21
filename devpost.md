# Apiki

## Inspiration

API keys are easy to create and surprisingly hard to manage well. They end up in notes, chat messages, `.env` files, old dashboards, and forgotten accounts. But the bigger problem we discovered while building: AI coding agents need API keys to do their job, and giving them direct access means keys end up in context windows, logs, screenshots, and chat histories. Every one of those is a leak vector.

Apiki started from a simple question: what if AI agents could access APIs without ever seeing the keys? And while we were at it — what would a calm, security-minded workspace look like for developers managing those same keys?

## What it does

Apiki is a live encrypted API key workspace and **zero-knowledge secret broker for AI coding agents**.

### For Developers

Users create an encrypted workspace with a passphrase, add API key records, store secret values as ciphertext in Neon, and track operational metadata around each key.

Apiki helps users manage:

- Encrypted API key storage with client-side encryption (AES-GCM via Web Crypto API)
- Service, owner, environment, and documentation metadata
- Rotation intervals and overdue rotation checks
- Workspace dashboard metrics and security scoring
- Status, cost, and usage-limit metadata
- Workspace monitoring rules for missing docs, inactive keys, overdue rotation, and high-cost records

### For AI Agents

Apiki acts as a **secret broker** — AI agents (Cline, Codex, Cursor, etc.) access APIs through Apiki's proxy without ever seeing raw keys:

- **MCP Server** — Agents connect via Model Context Protocol and call APIs through Apiki's tools
- **Proxy Gateway** — HTTP proxy at `/api/proxy/[...path]` decrypts keys server-side, injects them into requests, forwards to real APIs, returns only the response
- **Access Policies** — Per-agent rules controlling which services, methods, paths, and rate limits apply
- **Audit Logging** — Every agent API call is logged with agent ID, service, method, path, and status

Agents get API access. They never see credentials. Keys are decrypted only during request forwarding and exist in memory for microseconds.

The build is intentionally honest about scope. It uses a live Neon database, but does not pretend to provide provider validation, traffic analytics, billing, email alerts, or team collaboration.

## How we built it

We built Apiki as a Next.js, React, TypeScript, Prisma, and Neon app. The workspace uses the browser Web Crypto API to derive an AES-GCM encryption key from the user's passphrase with PBKDF2 (210,000 iterations). API key values are encrypted before they are sent to the API, so Neon stores ciphertext and metadata rather than plaintext secrets.

**Database requirement:** The encrypted workspace feature requires a Neon Postgres database. Without DATABASE_URL configured, the app will run but workspace creation/unlock will fail. The landing page and UI remain accessible for browsing the product.

The agent broker layer adds:

- **Proxy gateway** (`/api/proxy/[...path]`) — catch-all route that intercepts requests, checks access policies, decrypts keys from Neon, injects them into outgoing requests, and forwards to real APIs
- **MCP server** (`packages/mcp-server`) — standalone Node.js package using `@modelcontextprotocol/sdk` that agents connect to via stdio transport
- **Policy engine** — checks agent ID against service/method/path rules, enforces rate limits via audit log counting, supports time windows
- **Audit system** — every access attempt (allowed or denied) is logged to Neon with full context

The UI is built with a shared primitive layer for buttons, cards, panels, fields, badges, banners, dialogs, and empty states. The visual system uses a Mouve-inspired premium product theme with pill CTAs, raised primary actions, and consistent card/icon treatment.

Core routes include:

- Public landing page
- Workspace create/unlock gate
- Dashboard with security scoring
- API key inventory with reveal/copy/delete/rotate
- Rotation schedule with overdue tracking
- Analytics with environment/status/service breakdowns
- Monitoring with risk checks and rule toggles
- Agent management (`/agents`)
- Policy configuration (`/policies`)
- Audit log viewer (`/audit`)
- Settings with export/reset

Protected app routes use Next.js App Router route groups with a shared layout that gates access until the encrypted workspace is unlocked.

## Challenges we ran into

The biggest challenge was resisting fake demo shortcuts. A product like this can easily look impressive with seeded keys, fake metrics, and pretend monitoring, but that would be the wrong trust model for a security tool. We kept the app empty until the user creates real workspace records.

The agent broker architecture required careful thought about where decryption happens. We went through several iterations before landing on the proxy pattern: agent → MCP/proxy → decrypt → inject → forward. The key never touches the agent's context window.

Another challenge was connecting live storage without overstating the security model. Apiki encrypts secrets before persistence, but it does not claim to replace a production team secrets manager yet.

The UI also needed refinement. We moved away from scattered one-off components and built a consistent primitive system so the app feels like a coherent product instead of a collection of isolated screens.

## Accomplishments that we're proud of

We are proud that Apiki has a real encrypted workspace flow instead of a static mockup. Users can create a workspace, add encrypted key records, reveal and copy decrypted values after unlock, delete records, mark keys rotated, and review risk checks.

We are especially proud of the agent broker. It solves a real problem — AI agents need API access but shouldn't hold credentials. The proxy pattern means agents get full API functionality while keys remain encrypted and server-side. Every access is policy-controlled and audited.

We are also proud of the honesty in the product. Empty states stay empty. Integration limitations are visible. The app does not invent traffic, alerts, integrations, or hosted activity.

## What we learned

We learned that trust is as much a product-design problem as it is a technical problem. Encryption matters, but so do clear empty states, honest labels, route gates, and avoiding fake success.

We also learned that API key management is not only about storing secrets. The surrounding metadata matters: ownership, environment, docs, cost, status, and rotation policy are what make credentials maintainable over time.

And we learned that the secret broker pattern for AI agents is surprisingly straightforward once you have encrypted storage. The proxy gateway, policy engine, and audit logging layer naturally on top of the encrypted workspace.

## What's next for project

Next, Apiki could grow from a single-workspace key manager into a team-ready API key and agent access platform.

Planned next steps include:

- Team workspaces and role-based access
- Provider integrations for real key validation
- Real usage and traffic analytics
- Webhook, email, and Slack alerts for policy violations
- CLI exec wrapper for environment variable injection
- Temporary scoped token generation
- Import/export workflows
- Browser extension support for safer credential capture
- Stronger recovery and backup options
