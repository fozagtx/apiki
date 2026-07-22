# Apiki for AI Agents - Architecture Design

## The Problem

AI coding agents (Codex, Cursor, etc.) need API keys to:
- Call external APIs (deploy, monitor, fetch data)
- Run CLI tools that require auth
- Execute build/deploy scripts

But agents currently access keys through:
- `.env` files (plaintext in workspace)
- Environment variables (visible in process tree)
- Context window (keys appear in logs, screenshots, chat history)

**Every one of these is a leak vector.**

## The Solution: Apiki as a Secret Broker

Apiki becomes a **zero-knowledge secret proxy** - the agent never sees raw keys, but can still use them to call APIs and run tools.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  AI Coding Agent                     │
│                                                      │
│  "I need to deploy to Vercel"                        │
│  → Calls: apiki.exec("vercel", "deploy", args)       │
│  → OR:  fetch("http://localhost:9876/proxy/vercel")  │
│  → OR:  MCP tool: call_api({service:"vercel",...})   │
│                                                      │
│  Agent NEVER sees: sk_verc_xK92m...                  │
└──────────┬──────────────────────┬────────────────────┘
           │                      │
           ▼                      ▼
┌──────────────────┐   ┌──────────────────────┐
│  Apiki MCP Server│   │  Apiki Proxy Gateway  │
│  (stdio/SSE)     │   │  (localhost:9876)     │
│                  │   │                       │
│  Tools:          │   │  POST /proxy/:service │
│ - list_services │   │  POST /exec/:service  │
│ - call_api      │   │  GET  /env/:service   │
│ - run_command   │   │                       │
│ - inject_env    │   │  Injects real key     │
│                  │   │  into request/env      │
└────────┬─────────┘   └──────────┬────────────┘
         │                        │
         ▼                        ▼
┌─────────────────────────────────────────────────────┐
│              Apiki Core (Next.js API)                │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Encrypted   │  │ Access Policy│  │ Audit Log  │ │
│  │ Key Store   │  │ Engine       │  │            │ │
│  │ (Neon)      │  │              │  │            │ │
│  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                │                 │        │
│    AES-GCM keys     Who can access     What was    │
│    decrypted only   which keys,       accessed,    │
│    at request time  when, and how    when, how     │
└─────────────────────────────────────────────────────┘
```

---

## Three Access Patterns

### Pattern 1: MCP Server (Recommended)

The agent connects to Apiki via the Model Context Protocol.

```typescript
// apiki-mcp-server.ts
// The agent sees these tools, NOT the keys

const tools = {
  // Agent can see what services are configured
  list_services: {
    description: "List available API services",
    handler: async () => {
      return [
        { name: "vercel", label: "Vercel", status: "active" },
        { name: "neon", label: "Neon Postgres", status: "active" },
        { name: "openai", label: "OpenAI", status: "active" },
      ];
      // Agent sees: service names and status
      // Agent does NOT see: key values
    }
  },

  // Agent can call APIs through the proxy
  call_api: {
    description: "Make an API call through Apiki (key injected server-side)",
    input: {
      service: "vercel",        // Which service
      method: "GET",            // HTTP method
      path: "/v9/projects",     // API path
      body: {},                 // Request body
    },
    handler: async ({ service, method, path, body }) => {
      // 1. Check access policy
      if (!policyAllows(agentSession, service, method, path)) {
        throw new Error("Access denied by policy");
      }

      // 2. Decrypt the key (server-side only)
      const key = await decryptKey(service, workspaceKey);

      // 3. Make the request with the real key
      const response = await fetch(`https://api.vercel.com${path}`, {
        method,
        headers: { Authorization: `Bearer ${key}`, ...body.headers },
        body: body.body,
      });

      // 4. Return response (key never exposed)
      return await response.json();
    }
  },

  // Agent can run CLI commands with injected env vars
  run_command: {
    description: "Run a CLI command with API keys injected as env vars",
    input: {
      service: "vercel",
      command: "vercel deploy --prod",
      env_mapping: {
        "VERCEL_TOKEN": "vercel",  // env var name → service name
      }
    },
    handler: async ({ command, env_mapping }) => {
      // 1. Decrypt keys
      const env = {};
      for (const [envVar, service] of Object.entries(env_mapping)) {
        env[envVar] = await decryptKey(service, workspaceKey);
      }

      // 2. Spawn subprocess with injected env
      const result = await spawn(command, {
        env: { ...process.env, ...env },
        shell: true,
      });

      // 3. Return stdout/stderr (env vars scrubbed from output)
      return scrubSecrets(result);
    }
  },

  // Agent can request temporary scoped tokens
  create_temp_token: {
    description: "Create a short-lived scoped token for a service",
    input: {
      service: "openai",
      ttl_seconds: 300,  // 5 minutes
      scope: "chat.completions.create",  // Limited scope
    },
    handler: async ({ service, ttl_seconds, scope }) => {
      // Create a temporary proxy token
      const token = crypto.randomUUID();
      await storeTempToken(token, { service, scope, ttl_seconds });

      // Agent gets a proxy URL + temp token, NOT the real key
      return {
        proxy_url: `http://localhost:9876/proxy/${service}`,
        temp_token: token,
        expires_at: new Date(Date.now() + ttl_seconds * 1000),
      };
    }
  }
};
```

**What the agent sees:**
```json
{
  "services": ["vercel", "neon", "openai"],
  "proxy_url": "http://localhost:9876/proxy/vercel",
  "temp_token": "tok_abc123",
  "expires_at": "2026-07-21T22:30:00Z"
}
```

**What the agent NEVER sees:**
```
sk_verc_xK92mNpQ8sR4tU6vW8xY0zA2bC4dE6f
```

---

### Pattern 2: Local Proxy Gateway

A lightweight HTTP proxy running on localhost.

```bash
# Agent starts the proxy
$ apiki proxy start

# Proxy listens on localhost:9876
# Agent sends requests to proxy instead of real API

# Instead of:
$ curl -H "Authorization: Bearer sk_verc_..." https://api.vercel.com/v9/projects

# Agent does:
$ curl -H "X-Apiki-Service: vercel" http://localhost:9876/proxy/vercel/v9/projects
```

```typescript
// proxy-gateway.ts
app.post("/proxy/:service/*", async (req, res) => {
  const service = req.params.service;
  const serviceKey = await decryptKeyFromStore(service);

  // Inject the real key into the outgoing request
  const targetUrl = getServiceBaseUrl(service) + req.params[0];
  const response = await fetch(targetUrl, {
    method: req.method,
    headers: {
      ...req.headers,
      "Authorization": `Bearer ${serviceKey}`,  // Injected here
      "X-Apiki-Service": undefined,              // Strip our header
    },
    body: req.body,
  });

  // Return response to agent (key never exposed)
  res.status(response.status).json(await response.json());
});
```

---

### Pattern 3: Environment Injection Wrapper

For CLI tools that read env vars.

```bash
# Instead of:
$ VERCEL_TOKEN=sk_verc_... vercel deploy

# Agent does:
$ apiki exec --service vercel --env VERCEL_TOKEN -- vercel deploy

# Apiki:
# 1. Decrypts the vercel key
# 2. Sets VERCEL_TOKEN in the subprocess environment
# 3. Runs the command
# 4. Subprocess exits, key is gone from memory
```

---

## Access Policy Engine

Not every agent should access every key. Policies control what's allowed.

```typescript
type AccessPolicy = {
  agent_id: string;           // Which agent
  service: string;            // Which API service
  allowed_methods: string[];  // GET, POST, etc.
  allowed_paths: string[];    // /v9/projects, /v9/deployments
  max_requests_per_hour: number;
  require_approval_above: number;  // Cost threshold
  time_window?: {
    start: string;  // "09:00"
    end: string;    // "18:00"
  };
};

// Example policies
const policies: AccessPolicy[] = [
  {
    agent_id: "codex",
    service: "vercel",
    allowed_methods: ["GET"],
    allowed_paths: ["/v9/projects", "/v9/deployments"],
    max_requests_per_hour: 60,
    require_approval_above: 0,  // Read-only, no approval needed
  },
  {
    agent_id: "codex",
    service: "vercel",
    allowed_methods: ["POST"],
    allowed_paths: ["/v9/deployments"],
    max_requests_per_hour: 10,
    require_approval_above: 5,  // Deploy costs > $5 need approval
  },
  {
    agent_id: "codex",
    service: "openai",
    allowed_methods: ["POST"],
    allowed_paths: ["/v1/chat/completions"],
    max_requests_per_hour: 100,
    require_approval_above: 10,
  },
];
```

---

## Audit Log

Every access is logged for security review.

```typescript
type AuditEntry = {
  id: string;
  timestamp: string;
  agent_id: string;
  service: string;
  action: "api_call" | "command_exec" | "env_inject" | "token_create";
  method?: string;
  path?: string;
  status: "allowed" | "denied" | "approved";
  cost_estimate?: number;
  ip?: string;
};

// Example audit log
[
  { timestamp: "22:15:03", agent: "codex", service: "vercel", action: "api_call", method: "GET", path: "/v9/projects", status: "allowed" },
  { timestamp: "22:15:07", agent: "codex", service: "vercel", action: "api_call", method: "POST", path: "/v9/deployments", status: "allowed" },
  { timestamp: "22:16:01", agent: "codex", service: "stripe", action: "api_call", method: "DELETE", path: "/v1/products/prod_xxx", status: "denied" },
]
```

---

## What Changes in the Apiki App

### New Routes

| Route | Purpose |
|-------|---------|
| `/agents` | Manage connected agents and their identities |
| `/policies` | Configure access policies per agent/service |
| `/audit` | View access audit log |
| `/proxy` | Proxy gateway status and configuration |
| `/mcp` | MCP server connection settings |

### New UI Components

```
┌─────────────────────────────────────────────────┐
│  Agent: Codex                                    │
│  Status: ● Connected (via MCP)                   │
│                                                  │
│  Access Policies:                                │
│  ┌────────────────────────────────────────────┐  │
│  │ Vercel    │ GET  │ /v9/*        │ ✅ Allow │  │
│  │ Vercel    │ POST │ /v9/deploy   │ ✅ Allow │  │
│  │ Neon      │ ALL  │ *            │ ✅ Allow │  │
│  │ Stripe    │ ALL  │ *            │ ❌ Deny  │  │
│  │ OpenAI    │ POST │ /v1/chat     │ ✅ Allow │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  Recent Activity:                                │
│  22:15 GET /v9/projects → 200 OK                │
│  22:15 POST /v9/deployments → 201 Created       │
│  22:14 DELETE /stripe/products → 403 Denied     │
└─────────────────────────────────────────────────┘
```

---

## Security Model

### What the agent CAN do:
- ✅ See service names and status
- ✅ Make API calls through the proxy
- ✅ Run CLI commands with injected env
- ✅ Request temporary scoped tokens
- ✅ See its own audit log

### What the agent CANNOT do:
- ❌ See raw API key values
- ❌ Export or copy key material
- ❌ Access services outside its policy
- ❌ Exceed rate limits
- ❌ Bypass approval thresholds
- ❌ See other agents' activity

### Key never leaves the server:
```
Agent request → Apiki proxy → Decrypt key → Inject into request → Target API
                ↑                                                    │
                └──────────── Response (no key) ─────────────────────┘
```

---

## Implementation Priority

### Phase 1: MCP Server (Week 1-2)
- [ ] MCP server with `list_services` and `call_api` tools
- [ ] Basic access policy (allow/deny per service)
- [ ] Audit logging to Neon
- [ ] Agent connection via stdio transport

### Phase 2: Proxy Gateway (Week 3-4)
- [ ] Local HTTP proxy on localhost:9876
- [ ] Key injection for common providers (Vercel, Neon, OpenAI, GitHub)
- [ ] Temporary token generation
- [ ] Request/response logging

### Phase 3: CLI Integration (Week 5-6)
- [ ] `apiki exec` command for env injection
- [ ] `apiki proxy` command for gateway mode
- [ ] Secret scrubbing in stdout/stderr
- [ ] Shell completion

### Phase 4: Policy & Audit UI (Week 7-8)
- [ ] Agent management page
- [ ] Policy editor with templates
- [ ] Audit log viewer with filters
- [ ] Cost tracking and alerts

---

## Example: Agent Deploying to Vercel

### Before (insecure):
```typescript
// Agent reads .env, key is in context window
const token = process.env.VERCEL_TOKEN; // sk_verc_xK92m... LEAKED
await fetch("https://api.vercel.com/v9/deployments", {
  headers: { Authorization: `Bearer ${token}` }
});
// Key appears in:
// - Chat history
// - Logs
// - Screenshots
// - Error messages
```

### After (secure):
```typescript
// Agent calls through Apiki MCP
const result = await mcp.call("call_api", {
  service: "vercel",
  method: "POST",
  path: "/v9/deployments",
  body: { project: "my-app", target: "production" }
});
// Agent sees: { id: "dpl_abc123", url: "https://my-app.vercel.app", status: "READY" }
// Agent NEVER sees: sk_verc_xK92m...
// Key exists only in Apiki's encrypted store, decrypted for microseconds during the request
```

---

## Connection Setup

```jsonc
// .codex/config.toml or MCP config (or equivalent agent config)
{
  "mcpServers": {
    "apiki": {
      "command": "npx",
      "args": ["-y", "apiki-mcp-server"],
      "env": {
        "APIKI_WORKSPACE_ID": "primary",
        "APIKI_PASSPHRASE": "...",  // Or use keychain
        "APIKI_PROXY_PORT": "9876"
      }
    }
  }
}
```

The agent connects once, and from then on all API access goes through Apiki's secure proxy.
