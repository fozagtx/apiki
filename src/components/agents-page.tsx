"use client";

import { Bot, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, EmptyState, LiveBanner, Panel, PanelHeader } from "./ui";

type Agent = {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
};

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const loadAgents = async () => {
    const res = await fetch("/api/agents");
    const data = await res.json();
    setAgents(data.agents || []);
    setLoading(false);
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const createAgent = async () => {
    if (!newName.trim()) return;
    await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, description: newDesc }),
    });
    setNewName("");
    setNewDesc("");
    setShowCreate(false);
    loadAgents();
  };

  const deleteAgent = async (id: string) => {
    if (!confirm("Delete this agent?")) return;
    await fetch(`/api/agents?id=${id}`, { method: "DELETE" });
    loadAgents();
  };

  return (
    <div className="page-stack">
      <LiveBanner />
      <Panel>
        <PanelHeader
          icon={<Bot size={18} />}
          title="Connected Agents"
          action={
            <Button icon={<Plus size={16} />} onClick={() => setShowCreate(!showCreate)} variant="primary">
              Add Agent
            </Button>
          }
        />

        {showCreate && (
          <div className="form-grid" style={{ marginBottom: 20 }}>
            <input
              className="input"
              placeholder="Agent name (e.g., Cline, Codex)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              className="input"
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10 }}>
              <Button onClick={createAgent} variant="primary">Create</Button>
              <Button onClick={() => setShowCreate(false)} variant="secondary">Cancel</Button>
            </div>
          </div>
        )}

        {loading ? (
          <p>Loading agents...</p>
        ) : agents.length === 0 ? (
          <EmptyState
            icon={<Bot size={28} />}
            title="No agents connected"
            body="Add an agent to configure access policies and track API usage."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id}>
                    <td><strong>{agent.name}</strong></td>
                    <td>{agent.description || "—"}</td>
                    <td><span className={`badge badge-status-${agent.status}`}>{agent.status}</span></td>
                    <td>{new Date(agent.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Button icon={<Trash2 size={14} />} onClick={() => deleteAgent(agent.id)} size="sm" variant="danger">
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel>
        <PanelHeader icon={<Bot size={18} />} title="MCP Connection" />
        <div className="code-block">
          <code>
{`// .cline/mcp.json
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
}`}
          </code>
        </div>
        <p style={{ marginTop: 12, fontSize: 14, color: "var(--muted)" }}>
          Replace YOUR_AGENT_ID with an agent ID from the list above, and use your workspace passphrase.
        </p>
      </Panel>
    </div>
  );
}
