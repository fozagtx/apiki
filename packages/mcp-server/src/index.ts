#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Configuration from environment
const APIKI_BASE_URL = process.env.APIKI_BASE_URL || "http://localhost:8787";
const APIKI_AGENT_ID = process.env.APIKI_AGENT_ID || "mcp-agent";
const APIKI_PASSPHRASE = process.env.APIKI_PASSPHRASE || "";

// Helper to make requests to Apiki
async function apikiFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Apiki-Agent": APIKI_AGENT_ID,
    "X-Apiki-Passphrase": APIKI_PASSPHRASE,
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${APIKI_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Apiki request failed: ${response.status} - ${error}`);
  }

  return response.json();
}

// Create the MCP server
const server = new Server(
  {
    name: "apiki-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_services",
        description: "List available API services configured in Apiki. Returns service names and status without exposing keys.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "call_api",
        description: "Make an API call through Apiki's secure proxy. The API key is injected server-side and never exposed to you. Use this instead of making direct API calls.",
        inputSchema: {
          type: "object",
          properties: {
            service: {
              type: "string",
              description: "The service name (e.g., 'vercel', 'openai', 'github')",
            },
            method: {
              type: "string",
              description: "HTTP method (GET, POST, PUT, DELETE, PATCH)",
              enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
            },
            path: {
              type: "string",
              description: "API path (e.g., '/v9/projects' for Vercel)",
            },
            body: {
              type: "object",
              description: "Request body for POST/PUT/PATCH requests",
            },
          },
          required: ["service", "method", "path"],
        },
      },
      {
        name: "run_command",
        description: "Run a CLI command with API keys injected as environment variables. Keys are never exposed in the command output.",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description: "The command to run (e.g., 'vercel deploy --prod')",
            },
            env_mapping: {
              type: "object",
              description: "Map of environment variable names to service names (e.g., { VERCEL_TOKEN: 'vercel' })",
              additionalProperties: {
                type: "string",
              },
            },
          },
          required: ["command", "env_mapping"],
        },
      },
      {
        name: "get_audit_log",
        description: "Get your recent API access audit log. Use this to see what you've accessed.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Number of log entries to return (default: 50)",
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_services": {
        const result = await apikiFetch("/api/services");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result.services, null, 2),
            },
          ],
        };
      }

      case "call_api": {
        const { service, method, path, body } = args as {
          service: string;
          method: string;
          path: string;
          body?: Record<string, unknown>;
        };

        const proxyPath = `/api/proxy/${service}${path}`;
        const options: RequestInit = {
          method,
        };

        if (body && ["POST", "PUT", "PATCH"].includes(method)) {
          options.body = JSON.stringify(body);
        }

        const response = await fetch(`${APIKI_BASE_URL}${proxyPath}`, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            "X-Apiki-Agent": APIKI_AGENT_ID,
            "X-Apiki-Passphrase": APIKI_PASSPHRASE,
          },
        });

        const responseBody = await response.text();

        return {
          content: [
            {
              type: "text",
              text: `Status: ${response.status}\n\n${responseBody}`,
            },
          ],
          isError: !response.ok,
        };
      }

      case "run_command": {
        // This would need to be implemented on the Apiki server side
        // For now, return a message explaining the limitation
        return {
          content: [
            {
              type: "text",
              text: "Command execution is not yet implemented. Use call_api instead to make direct API calls through the proxy.",
            },
          ],
        };
      }

      case "get_audit_log": {
        const { limit = 50 } = (args as { limit?: number }) || {};
        const result = await apikiFetch(`/api/audit?agentId=${APIKI_AGENT_ID}&limit=${limit}`);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result.logs, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Apiki MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
