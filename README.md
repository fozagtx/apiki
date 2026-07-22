# Apiki

Pitch deck: https://api-keys-for-agentswitho-kxcz4af.gamma.site/

Repo: https://github.com/fozagtx/apiki

Encrypted API key workspace + proxy for AI coding agents. Agents call APIs through Apiki. They never see the raw keys.

Built with Codex — details in [CODEX_USAGE.md](CODEX_USAGE.md). Setup: [INSTALL.md](INSTALL.md).

## How it works

1. Create a workspace with a name + passphrase
2. Add API keys (encrypted in the browser before save)
3. Add an agent + a policy for which services it can use
4. Point Codex/Cursor at the MCP server or HTTP proxy
5. Apiki decrypts the key server-side, injects it, forwards the request, returns the response
6. Every call is audit-logged

```
Agent → MCP/Proxy → Policy check → Decrypt key → Inject → Upstream API → Response
```

## Run it

```bash
git clone https://github.com/fozagtx/apiki.git
cd apiki
npm install
npm run db:generate
npm run db:push
npm run dev
```

Open http://localhost:8787 — create a workspace, add keys, then wire an agent. Full agent setup is in [INSTALL.md](INSTALL.md).

## Config

`.env`:
```
DATABASE_URL="file:./dev.db"
PORT=8787
```

MCP env:
```
APIKI_BASE_URL="http://localhost:8787"
APIKI_AGENT_ID="codex"
APIKI_PASSPHRASE="your-workspace-passphrase"
```

## Pieces

- **Workspace** — passphrase-locked key store (AES-256-GCM, PBKDF2 210k)
- **Proxy** — `/api/proxy/[...path]`
- **MCP server** — `packages/mcp-server` (`list_services`, `call_api`, `get_audit_log`)
- **Policies** — per-agent service/method/path/rate limits
- **Audit log** — agent, service, method, path, status

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
