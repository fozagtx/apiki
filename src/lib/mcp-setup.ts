export const DEFAULT_AGENT_ID = "codex";

export type McpSetupResult = {
  agentId: string;
  service: string;
  createdAgent: boolean;
  createdPolicy: boolean;
  mcpJson: string;
};

function mcpServerPath() {
  // Absolute path for local Codex/Cursor MCP installs.
  return "/Users/kaizen/Desktop/apiki/packages/mcp-server/dist/index.js";
}

export function buildMcpConfigJson(agentId = DEFAULT_AGENT_ID) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:8787";
  const config = {
    mcpServers: {
      apiki: {
        command: "node",
        args: [mcpServerPath()],
        env: {
          APIKI_BASE_URL: baseUrl,
          APIKI_AGENT_ID: agentId,
          APIKI_PASSPHRASE: "PASTE_YOUR_PASSPHRASE",
        },
      },
    },
  };
  return JSON.stringify(config, null, 2);
}

export async function ensureCodexAccess(service: string): Promise<McpSetupResult> {
  const normalized = service.trim().toLowerCase();
  let createdAgent = false;
  let createdPolicy = false;

  const agentsRes = await fetch("/api/agents");
  const agentsData = await agentsRes.json();
  const agents = Array.isArray(agentsData.agents) ? agentsData.agents : [];
  const existingAgent = agents.find((agent: { id: string }) => agent.id === DEFAULT_AGENT_ID);

  if (!existingAgent) {
    const createRes = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: DEFAULT_AGENT_ID,
        name: "Codex",
        description: "Auto-created for MCP access",
      }),
    });
    if (!createRes.ok) {
      const payload = await createRes.json().catch(() => ({}));
      throw new Error(typeof payload.error === "string" ? payload.error : "Could not create Codex agent.");
    }
    createdAgent = true;
  }

  const policiesRes = await fetch(`/api/policies?agentId=${DEFAULT_AGENT_ID}`);
  const policiesData = await policiesRes.json();
  const policies = Array.isArray(policiesData.policies) ? policiesData.policies : [];
  const existingPolicy = policies.find(
    (policy: { service: string }) => policy.service.toLowerCase() === normalized,
  );

  if (!existingPolicy) {
    const createPolicyRes = await fetch("/api/policies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: DEFAULT_AGENT_ID,
        service: normalized,
        allowedMethods: ["*"],
        allowedPaths: ["*"],
        maxRequestsPerHour: 120,
        requireApprovalAbove: 0,
      }),
    });
    if (!createPolicyRes.ok) {
      const payload = await createPolicyRes.json().catch(() => ({}));
      throw new Error(typeof payload.error === "string" ? payload.error : "Could not create access policy.");
    }
    createdPolicy = true;
  }

  return {
    agentId: DEFAULT_AGENT_ID,
    service: normalized,
    createdAgent,
    createdPolicy,
    mcpJson: buildMcpConfigJson(DEFAULT_AGENT_ID),
  };
}
