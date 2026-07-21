# How Codex & GPT-5.6 Were Used

Built this with Codex and GPT-5.6. Here's what each did:

## Architecture

GPT-5.6 figured out the zero-knowledge proxy pattern. We went back and forth on how to keep keys away from agents. The proxy approach (decrypt server-side, inject, forward) was the cleanest solution.

## Security

Codex handled the crypto implementation. AES-256-GCM for encryption, PBKDF2 with 210k iterations for key derivation. Made sure plaintext keys never hit the server or database.

## Proxy Gateway

GPT-5.6 wrote the `/api/proxy/[...path]` route. Catches requests, checks policies, decrypts keys, forwards to real APIs. Added audit logging so everything's tracked.

## MCP Server

Codex built the MCP server in `packages/mcp-server`. Stdio transport, tools for `list_services`, `call_api`, `get_audit_log`. Agents connect to this instead of calling APIs directly.

## Database

GPT-5.6 designed the Prisma schema. SQLite tables for workspaces, API keys, policies, audit logs, agents. Kept it simple since it's a single-workspace MVP.

## UI

Codex generated the React components. Workspace gate, key management, policy editor, audit viewer, dashboard. Used a shared component library so everything looks consistent.

## Docs

GPT-5.6 wrote most of the technical docs. Explained the security model, proxy flow, setup instructions. I edited everything to make sure it's accurate.

## Debugging

Both tools helped fix issues. Encryption edge cases, policy matching bugs, rate limiting problems. Lots of back-and-forth to get things working right.

## What I Did

- Product vision and requirements
- Security threat model
- Code review and testing
- Final edits on all docs
- Deployment decisions

The AI wrote a lot of code, but I reviewed everything and made sure it actually works. No blind copy-paste.
