"use client";

import { Bot, Copy, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buildMcpConfigJson } from "@/lib/mcp-setup";
import { Button, EmptyState, Field, Panel, PanelHeader } from "./ui";

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
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [copied, setCopied] = useState(false);
  const mcpJson = useMemo(() => buildMcpConfigJson("codex"), []);

  const loadAgents = async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load agents.");
      setAgents(data.agents || []);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load agents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAgents();
  }, []);

  const createAgent = async () => {
    if (!newName.trim()) return;
    setError("");
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, description: newDesc }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Could not create agent.");
      return;
    }
    setNewName("");
    setNewDesc("");
    setShowCreate(false);
    await loadAgents();
  };

  const deleteAgent = async (id: string) => {
    if (!confirm("Delete this agent?")) return;
    await fetch(`/api/agents?id=${id}`, { method: "DELETE" });
    await loadAgents();
  };

  return (
    <div className="page-stack">
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
            <Field
              id="agent-name"
              label="Agent name"
              placeholder="e.g. codex, cursor"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Field
              id="agent-description"
              label="Description"
              placeholder="Optional"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10 }}>
              <Button onClick={createAgent} variant="primary">Create</Button>
              <Button onClick={() => setShowCreate(false)} variant="secondary">Cancel</Button>
            </div>
          </div>
        )}

        {error ? <p className="dialog-error">{error}</p> : null}

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
                  <th>Agent ID</th>
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
                    <td><code>{agent.id}</code></td>
                    <td>{agent.description || "—"}</td>
                    <td>{agent.status}</td>
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
        <PanelHeader
          icon={<Bot size={18} />}
          title="Codex MCP config"
          action={
            <Button
              icon={<Copy size={16} />}
              onClick={async () => {
                await navigator.clipboard.writeText(mcpJson);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              }}
              size="sm"
              variant="secondary"
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          }
        />
        <p className="plain-note" style={{ marginTop: 0 }}>
          Adding an API key auto-creates the Codex agent + policy. Copy this into Codex MCP settings and replace <code>PASTE_YOUR_PASSPHRASE</code>.
        </p>
        <div className="code-block">
          <code>{mcpJson}</code>
        </div>
      </Panel>
    </div>
  );
}
