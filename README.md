# Apiki

Pitch deck: https://api-keys-for-agentswitho-kxcz4af.gamma.site/

Repo: https://github.com/fozagtx/apiki

Encrypted API key workspace + proxy for AI coding agents. Agents call APIs through Apiki. They never see the raw keys.

Built with Codex - details in [CODEX_USAGE.md](CODEX_USAGE.md). Setup: [INSTALL.md](INSTALL.md).

## How it works

1. Create a workspace (name + passphrase)
2. Add an API key (e.g. OpenAI) - encrypted in the browser before save
3. Apiki auto-creates a **Codex** agent, a policy for that service, and an MCP config
4. Paste the MCP config into Codex - replace only `PASTE_YOUR_PASSPHRASE`
5. When Codex calls an API, Apiki checks policy, decrypts the key, injects it, forwards the request
6. Codex gets the response. It never sees the raw key. Every call is audit-logged.

```
Codex → Apiki MCP → Policy check → Decrypt key → Inject → Upstream API → Response
```

### What the MCP config means

After you add a key, Apiki shows something like:

```json
{
  "mcpServers": {
    "apiki": {
      "command": "node",
      "args": ["/Users/kaizen/Desktop/apiki/packages/mcp-server/dist/index.js"],
      "env": {
        "APIKI_BASE_URL": "http://localhost:8787",
        "APIKI_AGENT_ID": "codex",
        "APIKI_PASSPHRASE": "PASTE_YOUR_PASSPHRASE"
      }
    }
  }
}
```

| Field | Meaning |
|---|---|
| `command` + `args` | Run Apiki's local MCP server |
| `APIKI_BASE_URL` | Your running Apiki app |
| `APIKI_AGENT_ID` | Who is calling (`codex`) - must match the agent + policy |
| `APIKI_PASSPHRASE` | Your workspace passphrase (the only thing you fill in) |

Keep `npm run dev` running while Codex uses Apiki.

## Run it

```bash
git clone https://github.com/fozagtx/apiki.git
cd apiki
npm install
npm run db:generate
npm run db:push
npm run dev
```

Open http://localhost:8787 - create a workspace, add a key, copy the MCP config into Codex. More detail: [INSTALL.md](INSTALL.md).

## Config

`.env`:
```
DATABASE_URL="file:./dev.db"
PORT=8787
```

## Pieces

- **Workspace** - passphrase-locked key store (AES-256-GCM, PBKDF2 210k)
- **Proxy** - `/api/proxy/[...path]`
- **MCP server** - `packages/mcp-server` (`list_services`, `call_api`, `get_audit_log`)
- **Policies** - per-agent service/method/path/rate limits
- **Audit log** - agent, service, method, path, status

Services: Vercel, Neon, OpenAI, GitHub, Stripe, Anthropic, AWS, Supabase. Add more in `src/lib/agent/proxy.ts`.

## Quick checks

```bash
curl http://localhost:8787/api/health
curl http://localhost:8787/api/services
```

## Not built yet

- Multi-workspace / team auth
- Provider key validation
- Real traffic analytics
- Email/webhook alerts

## Layout

```
src/
  app/           # Next.js routes
  components/    # UI
  lib/
    agent/       # Proxy + policies
    crypto.ts
packages/
  mcp-server/    # MCP server
```

## License

MIT
