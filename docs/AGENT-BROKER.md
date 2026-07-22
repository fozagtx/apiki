# Apiki Agent Secret Broker

Apiki now acts as a **zero-knowledge secret proxy** for AI coding agents. Agents can access APIs without ever seeing the raw keys.

## What's Built

### 1. MCP Server (`packages/mcp-server`)

Agents connect via Model Context Protocol and get these tools:

- `list_services` - See what APIs are configured (no keys exposed)
- `call_api` - Make API calls through the proxy (keys injected server-side)
- `run_command` - Execute CLI commands with injected env vars (coming soon)
- `get_audit_log` - View your own access history

### 2. Proxy Gateway (`/api/proxy/[...path]`)

HTTP proxy that intercepts requests, decrypts keys, injects them, and forwards to the real API.

```
Agent → /api/proxy/vercel/v9/projects → Apiki decrypts key → api.vercel.com/v9/projects
```

### 3. Access Policy Engine

Control what each agent can access:
- Allowed HTTP methods (GET, POST, etc.)
- Allowed API paths (with wildcards)
- Rate limits (requests per hour)
- Time windows
- Cost thresholds requiring approval

### 4. Audit Logging

Every agent API call is logged:
- Agent ID
- Service accessed
- Method and path
- Status (allowed/denied)
- Timestamp

### 5. Management UI

Three new pages in the app:
- **/agents** - Create and manage agent identities
- **/policies** - Configure access rules per agent/service
- **/audit** - View access logs

## How It Works

### Agent Flow

```
1. Agent connects to Apiki MCP server
2. Agent calls: call_api({ service: "vercel", method: "GET", path: "/v9/projects" })
3. MCP server forwards to: /api/proxy/vercel/v9/projects
4. Proxy checks access policy → allowed/denied
5. If allowed: decrypt key from Neon, inject into request
6. Forward to real API: api.vercel.com/v9/projects
7. Return response to agent (key never exposed)
8. Log the access
```

### Security Model

**Agent CAN:**
- ✅ See service names and status
- ✅ Make API calls through the proxy
- ✅ View its own audit log

**Agent CANNOT:**
- ❌ See raw API key values
- ❌ Access services outside its policy
- ❌ Exceed rate limits
- ❌ Access restricted paths

**Key never leaves the server:**
```
Agent request → Apiki proxy → Decrypt key → Inject → Target API
                ↑                                          │
                └────────── Response (no key) ─────────────┘
```

## Setup

### 1. Start Apiki

```bash
npm run dev
```

### 2. Create an Agent

Go to `/agents` in the app, create an agent (e.g., "Codex").

### 3. Configure Policies

Go to `/policies`, create rules for the agent:
- Agent: Codex
- Service: vercel
- Methods: GET, POST
- Paths: /v9/*
- Rate limit: 60/hr

### 4. Connect Agent

Add to your agent's MCP config (e.g., `.codex/config.toml or MCP config`):

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

### 5. Use It

Agent can now call APIs:

```typescript
// Agent code
const result = await mcp.call("call_api", {
  service: "vercel",
  method: "GET",
  path: "/v9/projects"
});
// Agent sees: { projects: [...] }
// Agent NEVER sees: sk_verc_xK92m...
```

## Supported Services

Pre-configured for:
- Vercel
- Neon
- OpenAI
- GitHub
- Stripe
- Anthropic
- AWS
- Supabase

Add more in `src/lib/agent/proxy.ts`.

## API Endpoints

### Proxy

```
POST /api/proxy/:service/*
Headers:
  X-Apiki-Agent: agent-id
  X-Apiki-Passphrase: workspace-passphrase
```

### Agents

```
GET /api/agents - List agents
POST /api/agents - Create agent
DELETE /api/agents?id=xxx - Delete agent
```

### Policies

```
GET /api/policies - List policies
POST /api/policies - Create policy
DELETE /api/policies?id=xxx - Delete policy
```

### Audit

```
GET /api/audit?agentId=xxx&limit=100 - Get audit log
```

### Services

```
GET /api/services - List available services
```

## Database Schema

```prisma
model Agent {
  id          String   @id @default(cuid())
  name        String
  description String   @default("")
  status      String   @default("active")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model AccessPolicy {
  id                    String   @id @default(cuid())
  agentId               String
  service               String
  allowedMethods        String[]
  allowedPaths          String[]
  maxRequestsPerHour    Int      @default(60)
  requireApprovalAbove  Float    @default(0)
  timeWindow            Json?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model AuditLog {
  id            String   @id @default(cuid())
  timestamp     DateTime @default(now())
  agentId       String
  service       String
  action        String
  method        String?
  path          String?
  status        String
  costEstimate  Float?
  ip            String?
}
```

## Next Steps

- [ ] Build MCP server package (`cd packages/mcp-server && npm install && npm run build`)
- [ ] Add CLI exec wrapper for environment injection
- [ ] Add cost tracking and approval workflow
- [ ] Add webhook notifications for policy violations
- [ ] Add temporary token generation for scoped access
- [ ] Add more service configurations

## Security Notes

- Keys are encrypted in Neon (AES-GCM)
- Decrypted only during request forwarding
- Never stored in memory longer than request duration
- All access logged for audit
- Policy violations return 403 and are logged

This is a **secret broker**, not a secret store. Agents get access to APIs, not to keys.
