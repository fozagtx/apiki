# Apiki

Repository: https://github.com/fozagtx/apiki

API key management workspace for AI coding agents. Stores encrypted keys and proxies API requests so agents never see the actual credentials.

## Built with Codex

Used Codex and GPT-5.6 to build this. The AI helped with:
- Encryption implementation (AES-256-GCM, PBKDF2)
- Proxy gateway logic
- MCP server setup
- Database schema design
- Access control system

Full breakdown: [CODEX_USAGE.md](CODEX_USAGE.md)

Setup guide: [INSTALL.md](INSTALL.md)

## What it does

You have API keys for Vercel, OpenAI, GitHub, etc. You want AI agents (Cline, Codex, Cursor) to use those keys without actually seeing them. Apiki sits in the middle:

1. You encrypt your API keys with a passphrase
2. Agents call Apiki's proxy instead of calling APIs directly
3. Apiki decrypts the key, injects it into the request, forwards it
4. Agent gets the response, never sees the key

Everything's logged. You control who can access what through policies.

## How to use it

```bash
git clone https://github.com/fozagtx/apiki.git
cd apiki
npm install
npm run db:generate
npm run db:push
npm run dev
```

Open http://localhost:5173, create a workspace with a passphrase, add your API keys.

Then configure your agent to use the MCP server or HTTP proxy. See [INSTALL.md](INSTALL.md) for the full setup.

## Architecture

```
Agent → MCP/Proxy → Check policy → Decrypt key → Inject → Forward to API → Return response
```

The proxy at `/api/proxy/[...path]` handles everything. Keys are encrypted in SQLite with AES-256-GCM. Passphrase derives the encryption key using PBKDF2 (210k iterations).

## Components

- **Workspace** - Encrypted storage for API keys. Browser does the encryption before sending to server.
- **Proxy Gateway** - Catches agent requests, checks policies, decrypts keys, forwards to real APIs
- **MCP Server** - In `packages/mcp-server`. Agents connect via stdio. Tools: `list_services`, `call_api`, `get_audit_log`
- **Access Policies** - Per-agent rules. Which services, methods, paths, rate limits
- **Audit Log** - Every API call gets logged with agent ID, service, method, path, status

## Supported services

Vercel, Neon, OpenAI, GitHub, Stripe, Anthropic, AWS, Supabase. Add more in `src/lib/agent/proxy.ts`.

## Configuration

`.env`:
```
DATABASE_URL="file:./dev.db"
PORT=5173
```

MCP server needs:
```
APIKI_BASE_URL="http://localhost:5173"
APIKI_AGENT_ID="your-agent-id"
APIKI_PASSPHRASE="your-workspace-passphrase"
```

## Testing

```bash
npx tsc --noEmit  # Type check
npm run build     # Production build
npm run dev       # Start dev server

# Test endpoints
curl http://localhost:5173/api/health
curl http://localhost:5173/api/services -H "X-Apiki-Passphrase: your-passphrase"
```

## What's not implemented

- Multiple workspaces (only one per deployment)
- User authentication (just passphrase for now)
- Provider validation (doesn't check if keys are valid)
- Real traffic analytics (just metadata-based)
- Email/webhook alerts
- Team collaboration features

## Project structure

```
src/
  app/           # Next.js routes
  components/    # React components
  lib/
    agent/       # Proxy and policy logic
    crypto.ts    # Encryption stuff
    helpers.ts   # Utilities
    types.ts     # TypeScript types

packages/
  mcp-server/    # MCP server for agents
```

## License

MIT
