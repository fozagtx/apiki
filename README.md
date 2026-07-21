# Apiki

> **Repository:** https://github.com/fozagtx/apiki

Live encrypted API key workspace and secret broker for AI coding agents.

## Built with Codex

Built using Codex with GPT-5.6:
- Zero-knowledge secret broker architecture
- AES-256-GCM encryption with PBKDF2 key derivation
- Proxy gateway with policy enforcement
- MCP server for agent integration
- Access control and audit logging system
- SQLite database schema for encrypted workspaces

📖 [How Codex & GPT-5.6 Were Used](CODEX_USAGE.md) - Detailed breakdown of AI tool usage

📦 [Installation & Setup Guide](INSTALL.md) - Full installation instructions, supported platforms, and testing guide

## What is it?

Apiki is a zero-knowledge secret proxy that lets AI agents access APIs without ever seeing raw keys. It combines encrypted key storage with a policy-controlled proxy gateway.

**Core components:**

1. **Encrypted Workspace** (required) — Store API keys with client-side encryption. Keys are encrypted in your browser before reaching the database. You control the passphrase.

2. **Proxy Gateway** (required) — HTTP proxy at `/api/proxy/[...path]` that decrypts keys server-side, injects them into requests, and forwards to real APIs. Agents call the proxy, not the APIs directly.

3. **MCP Server** (optional) — Model Context Protocol server in `packages/mcp-server` that agents connect to. Provides tools: `list_services`, `call_api`, `run_command`, `get_audit_log`.

4. **Access Policies** (required) — Per-agent, per-service rules controlling which methods, paths, and rate limits apply. Policies are enforced before any key is decrypted.

5. **Audit Logging** (required) — Every agent API call is logged with agent ID, service, method, path, status, and timestamp.

## Quick Start

```bash
# Clone and install
git clone https://github.com/fozagtx/apiki.git
cd apiki
npm install
npm run db:generate
npm run db:push
npm run dev

# Open http://localhost:5173
# Create workspace with passphrase
# Add API keys
# Configure your agent (see INSTALL.md)
```

## How it works

```
Agent (Cline, Codex, etc.)
  │
  ├─ MCP Server (stdio)
  │   └─ call_api({ service: "vercel", method: "GET", path: "/v9/projects" })
  │
  └─ HTTP Proxy
      └─ GET /api/proxy/vercel/v9/projects
         Headers: X-Apiki-Agent: cline, X-Apiki-Passphrase: ***
         
         ↓
         
Apiki Proxy Gateway (/api/proxy/[...path])
  │
  ├─ 1. Check access policy → allowed / denied
  │      (if denied: return 403, log to audit)
  │
  ├─ 2. Decrypt key from database (AES-GCM)
  │      (key exists only in memory for microseconds)
  │
  ├─ 3. Inject key into request
  │      Authorization: Bearer sk_verc_...
  │
  ├─ 4. Forward to real API
  │      → api.vercel.com/v9/projects
  │
  ├─ 5. Return response to agent
  │      (response contains no key material)
  │
  └─ 6. Log access to audit table
```

**Safety limits:**
- Keys are never stored in plaintext
- Keys are never returned to agents
- Keys are decrypted only during request forwarding
- All access is logged for audit

## Why use it?

- **Agents get API access without key exposure** — Agents call APIs through the proxy. They see responses, not credentials.
- **Policy-controlled access** — Restrict agents by service, method, path, rate limit, and time window.
- **Full audit trail** — Every API call is logged with agent ID, service, method, path, and status.
- **Client-side encryption** — Keys are encrypted in your browser before reaching the database. You control the passphrase.
- **Works with any MCP-compatible agent** — Cline, Codex, Cursor, Continue, Grok, etc.

## Supported services

Pre-configured for:
- Vercel
- Neon
- OpenAI
- GitHub
- Stripe
- Anthropic
- AWS
- Supabase

Add more in `src/lib/agent/proxy.ts` by extending `SERVICE_CONFIGS`.

## Configuration

**Environment variables (`.env`):**

```bash
DATABASE_URL="file:./dev.db"
PORT=5173
```

**MCP Server environment variables:**

```bash
APIKI_BASE_URL="http://localhost:5173"
APIKI_AGENT_ID="cline"
APIKI_PASSPHRASE="your-workspace-passphrase"
```

**Access policy fields:**

- `agentId` — Which agent (e.g., "cline", "codex")
- `service` — Which API service (e.g., "vercel", "openai")
- `allowedMethods` — HTTP methods (e.g., ["GET", "POST"] or ["*"])
- `allowedPaths` — API paths (e.g., ["/v9/*"] or ["*"])
- `maxRequestsPerHour` — Rate limit (e.g., 60)
- `requireApprovalAbove` — Cost threshold requiring approval (e.g., 5.00)
- `timeWindow` — Optional time restriction (e.g., {"start": "09:00", "end": "18:00"})

## Testing

```bash
# Type check
npx tsc --noEmit

# Build for production
npm run build

# Start development server
npm run dev

# Test health endpoint
curl http://localhost:5173/api/health

# Test proxy (requires workspace setup)
curl http://localhost:5173/api/services \
  -H "X-Apiki-Passphrase: your-workspace-passphrase"
```

## Important limits

- **Database required for workspace features** — The encrypted workspace (API keys, agents, policies, audit logs) requires the SQLite database. Without `DATABASE_URL` configured, the app will run but workspace creation/unlock will fail. The landing page and UI remain accessible.
- **Single workspace MVP** — Apiki currently supports one workspace per deployment. Multi-workspace and team auth are not implemented.
- **No provider validation** — Apiki does not validate keys against provider APIs. It stores encrypted keys and proxies requests.
- **No real traffic analytics** — Analytics are derived from stored metadata, not live API traffic.
- **No email/webhook alerts** — Monitoring checks are computed from workspace data. Alerts are not sent.
- **Passphrase is the only auth** — There is no user authentication. Anyone with the passphrase can unlock the workspace.
- **Keys are never returned to agents** — Agents get API responses, not credentials. This is by design.
- **Policy violations are logged, not blocked by default** — Denied requests return 403 and are logged. You must configure policies to restrict access.

## Project structure

```
src/
├── app/                    # Next.js App Router routes
│   ├── (app)/              # Protected routes (dashboard, keys, agents, etc.)
│   ├── api/                # API routes (proxy, agents, policies, audit)
│   ├── layout.tsx          # Root layout with WorkspaceProvider
│   ├── page.tsx            # Landing page
│   └── login/page.tsx      # Workspace gate
├── components/             # React components
├── lib/                    # Shared utilities
│   ├── agent/              # Agent broker (policy, proxy)
│   ├── api.ts              # API client functions
│   ├── crypto.ts           # Web Crypto encryption/decryption
│   ├── helpers.ts          # Metrics, formatting, monitoring
│   └── types.ts            # TypeScript types
└── styles.css              # Global styles

packages/
└── mcp-server/             # MCP server for agent connections
```

## License

MIT
