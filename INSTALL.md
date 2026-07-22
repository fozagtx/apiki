# Installation & Setup

## Supported Platforms

- **Operating Systems:** macOS, Linux, Windows (WSL recommended)
- **Node.js:** v18.17.0 or higher (LTS recommended)
- **Browsers:** Chrome 90+, Firefox 88+, Safari 15+, Edge 90+ (for Web Crypto API support)
- **Agents:** Codex, Cursor, Continue, Grok, or any MCP-compatible agent

## Prerequisites

- Node.js 18+ and npm
- Git
- A modern web browser
- (Optional) An AI coding agent that supports MCP or HTTP proxies

## Step 1: Install Apiki

```bash
# Clone the repository
git clone https://github.com/fozagtx/apiki.git
cd apiki

# Install dependencies
npm install

# Initialize the SQLite database
npm run db:generate
npm run db:push

# Start the development server
npm run dev
```

Apiki will be running at `http://localhost:8787`

## Step 2: Create Your Workspace

1. Open `http://localhost:8787` in your browser
2. Create a workspace (name + passphrase)
3. Enter a passphrase (needed to unlock later)
4. Add your first API key:
   - Service: e.g., "vercel", "openai", "github"
   - Name: e.g., "Production Vercel Token"
   - API Key: paste your actual API key
   - Environment: Production/Staging/Development
5. Click "Save"

Keys are encrypted in the browser before save. Plaintext never hits the server.

## Step 3: Configure Your Agent

### Option A: MCP Server (Recommended for Codex, Cursor)

Edit your agent's MCP configuration file:

**For Codex** (`~/.codex/config.json`):
```json
{
  "mcpServers": {
    "apiki": {
      "command": "node",
      "args": ["/absolute/path/to/apiki/packages/mcp-server/dist/index.js"],
      "env": {
        "APIKI_BASE_URL": "http://localhost:8787",
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
        "APIKI_BASE_URL": "http://localhost:8787",
        "APIKI_AGENT_ID": "cursor",
        "APIKI_PASSPHRASE": "your-workspace-passphrase"
      }
    }
  }
}
```

### Option B: HTTP Proxy (For any agent or custom integration)

Your agent can call Apiki's proxy directly:

```bash
# Example: Call Vercel API through Apiki proxy
curl -X GET http://localhost:8787/api/proxy/vercel/v9/projects \
  -H "X-Apiki-Agent: my-agent" \
  -H "X-Apiki-Passphrase: your-workspace-passphrase"
```

The proxy will:
1. Check access policies for the agent
2. Decrypt the Vercel API key from the database
3. Inject it into the request as `Authorization: Bearer <key>`
4. Forward to `https://api.vercel.com/v9/projects`
5. Return the response (without exposing the key)

## Step 4: Set Up Access Policies

Create policies to control what each agent can do:

```bash
# Allow Codex to read Vercel projects (GET only)
curl -X POST http://localhost:8787/api/policies \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "codex",
    "service": "vercel",
    "allowedMethods": ["GET"],
    "allowedPaths": ["/v9/projects", "/v9/projects/*"],
    "maxRequestsPerHour": 60,
    "requireApprovalAbove": 0
  }'

# Allow Codex to call OpenAI API (all methods)
curl -X POST http://localhost:8787/api/policies \
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

## Step 5: Verify Everything Works

### Test the Health Check

```bash
curl http://localhost:8787/api/health
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

### Test the Proxy

```bash
# List available services
curl http://localhost:8787/api/services \
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

### Test an Agent Call (via MCP)

In your agent (Codex, Cursor, etc.), try:
```
Use Apiki to list my Vercel projects
```

The agent should call the `list_services` or `call_api` tool, and Apiki will proxy the request without exposing your API key.

### Check the Audit Log

```bash
curl "http://localhost:8787/api/audit?limit=10"
```

You should see entries for every API call made through the proxy, including:
- Agent ID
- Service name
- HTTP method and path
- Status (allowed/denied)
- Timestamp

## Troubleshooting

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
