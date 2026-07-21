# Apiki

> **Repository:** [YOUR_REPO_URL_HERE]

Live encrypted API key workspace and secret broker for AI coding agents.

## What is it?

Apiki is a zero-knowledge secret proxy that lets AI agents access APIs without ever seeing raw keys. It combines encrypted key storage with a policy-controlled proxy gateway.

**Core components:**

### Supported Platforms

- **Operating Systems:** macOS, Linux, Windows (WSL recommended)
- **Node.js:** v18.17.0 or higher (LTS recommended)
- **Browsers:** Chrome 90+, Firefox 88+, Safari 15+, Edge 90+ (for Web Crypto API support)
- **Agents:** Cline, Codex, Cursor, Continue, Grok, or any MCP-compatible agent

### Prerequisites

- Node.js 18+ and npm
- Git
- A modern web browser
- (Optional) An AI coding agent that supports MCP or HTTP proxies

### Step 1: Install Apiki

```bash
# Clone the repository
git clone <your-repo-url>
cd apiki

# Install dependencies
npm install

# Initialize the SQLite database
npm run db:generate
npm run db:push

# Start the development server
npm run dev
```

Apiki will be running at `http://localhost:5173`

### Step 2: Create Your Workspace

1. Open `http://localhost:5173` in your browser
2. Click "Create Workspace"
3. Enter a **strong passphrase** (you'll need this to unlock your workspace)
4. Add your first API key:
   - Service: e.g., "vercel", "openai", "github"
   - Name: e.g., "Production Vercel Token"
   - API Key: paste your actual API key
   - Environment: Production/Staging/Development
5. Click "Save"

Your API key is now encrypted with AES-256-GCM using PBKDF2 key derivation (210,000 iterations). The plaintext key never touches the server.

### Step 3: Configure Your Agent

#### Option A: MCP Server (Recommended for Cline, Codex, Cursor)

Edit your agent's MCP configuration file:

**For Cline** (`~/.cline/mcp_settings.json`):
```json
{
  "mcpServers": {
    "apiki": {
      "command": "node",
      "args": ["/absolute/path/to/apiki/packages/mcp-server/dist/index.js"],
      "env": {
        "APIKI_BASE_URL": "http://localhost:5173",
        "APIKI_AGENT_ID": "cline",
        "APIKI_PASSPHRASE": "your-workspace-passphrase"
      }
    }
  }
}
```

**For Codex** (`~/.codex/config.json`):
```json
{
  "mcpServers": {
    "apiki": {
      "command": "node",
      "args": ["/absolute/path/to/apiki/packages/mcp-server/dist/index.js"],
      "env": {
        "APIKI_BASE_URL": "http://localhost:5173",
        "APIKI_AGENT_ID": "codex",
        "APIKI_PASSPHRASE": "your-workspace-passphrase"
      }
    }
  }
}
```

**For Cursor** (`.cursor/mcp.json` in your project):
```json
{
  "mcpServers": {
    "apiki": {
      "command": "node",
      "args": ["/absolute/path/to/apiki/packages/mcp-server/dist/index.js"],
      "env": {
        "APIKI_BASE_URL": "http://localhost:5173",
        "APIKI_AGENT_ID": "cursor",
        "APIKI_PASSPHRASE": "your-workspace-passphrase"
      }
    }
  }
}
```

#### Option B: HTTP Proxy (For any agent or custom integration)

Your agent can call Apiki's proxy directly:

```bash
# Example: Call Vercel API through Apiki proxy
curl -X GET http://localhost:5173/api/proxy/vercel/v9/projects \
  -H "X-Apiki-Agent: my-agent" \
  -H "X-Apiki-Passphrase: your-workspace-passphrase"
```

The proxy will:
1. Check access policies for the agent
2. Decrypt the Vercel API key from the database
3. Inject it into the request as `Authorization: Bearer <key>`
4. Forward to `https://api.vercel.com/v9/projects`
5. Return the response (without exposing the key)

### Step 4: Set Up Access Policies

Create policies to control what each agent can do:

```bash
# Allow Cline to read Vercel projects (GET only)
curl -X POST http://localhost:5173/api/policies \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "cline",
    "service": "vercel",
    "allowedMethods": ["GET"],
    "allowedPaths": ["/v9/projects", "/v9/projects/*"],
    "maxRequestsPerHour": 60,
    "requireApprovalAbove": 0
  }'

# Allow Codex to call OpenAI API (all methods)
curl -X POST http://localhost:5173/api/policies \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "codex",
    "service": "openai",
    "allowedMethods": ["*"],
    "allowedPaths": ["*"],
    "maxRequestsPerHour": 100,
    "requireApprovalAbove": 5.00
  }'
```

### Step 5: Verify Everything Works

#### Test the Health Check

```bash
curl http://localhost:5173/api/health
```

Expected response:
```json
{
  "ok": true,
  "status": "ready",
  "database": "sqlite",
  "path": "/absolute/path/to/prisma/dev.db",
  "exists": true
}
```

#### Test the Proxy

```bash
# List available services
curl http://localhost:5173/api/services \
  -H "X-Apiki-Passphrase: your-workspace-passphrase"
```

Expected response:
```json
{
  "services": [
    { "name": "vercel", "label": "Vercel", "status": "active", "hasKey": true },
    { "name": "openai", "label": "OpenAI", "status": "not_configured", "hasKey": false }
  ]
}
```

#### Test an Agent Call (via MCP)

In your agent (Cline, Codex, etc.), try:
```
Use Apiki to list my Vercel projects
```

The agent should call the `list_services` or `call_api` tool, and Apiki will proxy the request without exposing your API key.

#### Check the Audit Log

```bash
curl "http://localhost:5173/api/audit?limit=10"
```

You should see entries for every API call made through the proxy, including:
- Agent ID
- Service name
- HTTP method and path
- Status (allowed/denied)
- Timestamp

### Troubleshooting

**"Database is unavailable"**
- Run `npm run db:push` to initialize the SQLite database
- Check that `prisma/dev.db` exists

**"Invalid passphrase"**
- Make sure you're using the exact passphrase you created the workspace with
- The passphrase is case-sensitive

**"No policy found for this agent/service"**
- Create an access policy for the agent and service combination
- See Step 4 above

**Agent can't connect to MCP server**
- Verify the absolute path to `packages/mcp-server/dist/index.js`
- Check that `APIKI_BASE_URL` points to your running Apiki instance
- Ensure `APIKI_PASSPHRASE` matches your workspace passphrase

**Proxy returns 403 Forbidden**
- Check the audit log to see the denial reason
- Verify the agent has a policy for that service
- Ensure the HTTP method and path are allowed

**Core components:**

1. **Encrypted Workspace** (required) — Store API keys with client-side encryption. Keys are encrypted in your browser before reaching the database. You control the passphrase.

2. **Proxy Gateway** (required) — HTTP proxy at `/api/proxy/[...path]` that decrypts keys server-side, injects them into requests, and forwards to real APIs. Agents call the proxy, not the APIs directly.

3. **MCP Server** (optional) — Model Context Protocol server in `packages/mcp-server` that agents connect to. Provides tools: `list_services`, `call_api`, `run_command`, `get_audit_log`.

4. **Access Policies** (required) — Per-agent, per-service rules controlling which methods, paths, and rate limits apply. Policies are enforced before any key is decrypted.

5. **Audit Logging** (required) — Every agent API call is logged with agent ID, service, method, path, status, and timestamp.

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

**Stop conditions:**
- Policy check fails → 403 Forbidden, logged as "denied"
- Key decryption fails → 401 Unauthorized
- Rate limit exceeded → 429 Too Many Requests
- Service not configured → 404 Not Found

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

**Note:** Apiki is a secret broker, not a secret store. Agents get access to APIs, not to keys. Speed and rate limits depend on your database setup and the target APIs.

## Install

**Requirements:**
- Node.js 18+
- npm or yarn

**Optional (for full workspace functionality):**
- SQLite database (included by default)

**Note:** Apiki uses a local SQLite database for the encrypted workspace feature (storing API keys, managing agents, policies, audit logs). The database is created automatically when you run `npm run db:push`.

**Installation:**

```bash
# Clone the repo
git clone <your-repo-url>
cd apiki

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env if needed (default SQLite path works out of the box)

# Push schema to database
npm run db:push

# Start development server
npm run dev
```

The app runs at `http://localhost:5173`.

## Quick start

**Recipe A — Full setup with agent broker (recommended)**

```bash
# 1. Start Apiki
npm run dev

# 2. Open http://localhost:5173
# 3. Create workspace with a strong passphrase
# 4. Add API keys (e.g., Vercel, OpenAI, GitHub)
# 5. Go to /agents, create an agent (e.g., "Cline")
# 6. Go to /policies, create rules for the agent
# 7. Configure your agent's MCP client (see below)
```

**Recipe B — Key management only (no agents)**

```bash
# 1. Start Apiki
npm run dev

# 2. Open http://localhost:5173
# 3. Create workspace
# 4. Add API keys
# 5. Use the dashboard to manage keys, track rotations, review analytics
```

**Recipe C — Connect an agent**

Add to your agent's MCP config (e.g., `.cline/mcp.json`):

```json
{
  "mcpServers": {
    "apiki": {
      "command": "npx",
      "args": ["-y", "apiki-mcp-server"],
      "env": {
        "APIKI_BASE_URL": "http://localhost:5173",
        "APIKI_AGENT_ID": "YOUR_AGENT_ID",
        "APIKI_PASSPHRASE": "your-workspace-passphrase"
      }
    }
  }
}
```

Replace `YOUR_AGENT_ID` with the agent ID from `/agents`, and use your workspace passphrase.

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

## Useful commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Push schema changes to database
npm run db:push

# Generate Prisma client
npm run db:generate

# Type check
npx tsc --noEmit
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

## Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Start development server
npm run dev

# Type check
npx tsc --noEmit

# Build for production
npm run build
```

**Project structure:**

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

## Update

Apiki does not have a self-update mechanism. To update:

```bash
git pull
npm install
npm run db:push
npm run build
```

If the Prisma schema changes, `npm run db:push` will sync your database. Review migration notes in the commit history before updating.

## Uninstall

To stop using Apiki:

```bash
# Stop the development server (Ctrl+C)

# Remove the database (optional)
# Delete the workspace from /settings or remove prisma/dev.db

# Remove the project directory
rm -rf apiki
```

**Note:** API keys are encrypted in the database. If you delete the workspace from `/settings`, all encrypted keys are removed. If you delete the database file, all data is gone. Back up any keys you need before uninstalling.

## License

MIT
