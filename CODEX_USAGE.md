# How Codex & GPT-5.6 Were Used

This project was built with extensive assistance from **OpenAI Codex** and **GPT-5.6**.

## Architecture Design

GPT-5.6 helped design the zero-knowledge secret broker pattern, ensuring keys never touch agent context windows. The AI assisted in:

- Designing the proxy gateway architecture that decrypts keys server-side
- Planning the access policy enforcement system
- Structuring the audit logging to track all agent API calls
- Designing the workspace encryption model using Web Crypto API

## Security Implementation

Codex assisted with Web Crypto API integration and secure passphrase handling:

- Implementing AES-256-GCM encryption for API keys
- Setting up PBKDF2 key derivation with 210,000 iterations
- Ensuring plaintext keys never touch the server or database
- Designing the client-side encryption flow in the browser

## Proxy Gateway Logic

GPT-5.6 generated the proxy route handlers and access control system:

- Created the catch-all route at `/api/proxy/[...path]`
- Implemented policy checking before key decryption
- Built the key injection and request forwarding logic
- Added comprehensive error handling and audit logging

## MCP Server Development

Codex scaffolded the Model Context Protocol server in `packages/mcp-server`:

- Generated tool definitions for `list_services`, `call_api`, `run_command`, and `get_audit_log`
- Implemented stdio transport for agent communication
- Created the HTTP client that communicates with the Apiki proxy
- Built the agent authentication and passphrase handling

## Database Schema

GPT-5.6 designed the Prisma schema for the SQLite database:

- Created the `Workspace` model for encrypted workspace metadata
- Designed the `ApiKeyRecord` model for storing encrypted API keys
- Built the `AccessPolicy` model for per-agent, per-service rules
- Structured the `AuditLog` model for tracking all API access
- Created the `Agent` model for managing registered agents

## UI Components

Codex generated React components for the workspace interface:

- Built the workspace gate and unlock flow
- Created the key management interface (add, edit, delete, rotate)
- Designed the policy editor for access control configuration
- Built the audit log viewer with filtering and search
- Created the dashboard with security metrics and monitoring

## Documentation

GPT-5.6 wrote technical documentation explaining the security model:

- Documented the proxy flow and zero-knowledge architecture
- Explained the encryption and key derivation process
- Created installation and setup instructions
- Wrote troubleshooting guides for common issues
- Documented the access policy system and audit logging

## Debugging & Refinement

Both tools helped debug edge cases and refine the implementation:

- Fixed encryption/decryption flow issues
- Resolved policy matching logic bugs
- Improved rate limiting implementation
- Optimized database queries for SQLite
- Fixed UI component rendering and state management issues

## Development Workflow

The typical workflow was:

1. **Describe the requirement** to GPT-5.6 or Codex
2. **Review the generated code** for correctness and security
3. **Test the implementation** in the development environment
4. **Iterate on fixes** when issues were found
5. **Refine the solution** based on testing and edge cases

## Key Contributions

- **GPT-5.6**: Architecture design, security model, proxy logic, database schema, documentation
- **Codex**: Security implementation, MCP server, UI components, debugging

## What Was Human-Driven

- Product vision and requirements
- Security threat model and trust boundaries
- Final code review and security audit
- Testing strategy and validation
- Deployment decisions and configuration