"use client";

import { Shield, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, EmptyState, LiveBanner, Panel, PanelHeader } from "./ui";

type Agent = { id: string; name: string };
type Policy = {
  id: string;
  agentId: string;
  service: string;
  allowedMethods: string[];
  allowedPaths: string[];
  maxRequestsPerHour: number;
  requireApprovalAbove: number;
};

export function PoliciesPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    agentId: "",
    service: "",
    allowedMethods: "*",
    allowedPaths: "/*",
    maxRequestsPerHour: "60",
    requireApprovalAbove: "0",
  });

  const loadData = async () => {
    const [agentsRes, policiesRes] = await Promise.all([
      fetch("/api/agents"),
      fetch("/api/policies"),
    ]);
    const agentsData = await agentsRes.json();
    const policiesData = await policiesRes.json();
    setAgents(agentsData.agents || []);
    setPolicies(policiesData.policies || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const createPolicy = async () => {
    if (!form.agentId || !form.service) return;
    await fetch("/api/policies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: form.agentId,
        service: form.service,
        allowedMethods: form.allowedMethods.split(",").map((m) => m.trim()),
        allowedPaths: form.allowedPaths.split(",").map((p) => p.trim()),
        maxRequestsPerHour: parseInt(form.maxRequestsPerHour),
        requireApprovalAbove: parseFloat(form.requireApprovalAbove),
      }),
    });
    setShowCreate(false);
    setForm({
      agentId: "",
      service: "",
      allowedMethods: "*",
      allowedPaths: "/*",
      maxRequestsPerHour: "60",
      requireApprovalAbove: "0",
    });
    loadData();
  };

  const deletePolicy = async (id: string) => {
    if (!confirm("Delete this policy?")) return;
    await fetch(`/api/policies?id=${id}`, { method: "DELETE" });
    loadData();
  };

  const getAgentName = (agentId: string) => {
    return agents.find((a) => a.id === agentId)?.name || agentId;
  };

  return (
    <div className="page-stack">
      <LiveBanner />
      <Panel>
        <PanelHeader
          icon={<Shield size={18} />}
          title="Access Policies"
          action={
            <Button icon={<Plus size={16} />} onClick={() => setShowCreate(!showCreate)} variant="primary">
              Add Policy
            </Button>
          }
        />

        {showCreate && (
          <div className="form-grid" style={{ marginBottom: 20 }}>
            <select
              className="input"
              value={form.agentId}
              onChange={(e) => setForm({ ...form, agentId: e.target.value })}
            >
              <option value="">Select agent...</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <input
              className="input"
              placeholder="Service (e.g., vercel, openai)"
              value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value })}
            />
            <input
              className="input"
              placeholder="Methods (comma-separated, e.g., GET,POST or *)"
              value={form.allowedMethods}
              onChange={(e) => setForm({ ...form, allowedMethods: e.target.value })}
            />
            <input
              className="input"
              placeholder="Paths (comma-separated, e.g., /v9/* or *)"
              value={form.allowedPaths}
              onChange={(e) => setForm({ ...form, allowedPaths: e.target.value })}
            />
            <input
              className="input"
              type="number"
              placeholder="Max requests/hour"
              value={form.maxRequestsPerHour}
              onChange={(e) => setForm({ ...form, maxRequestsPerHour: e.target.value })}
            />
            <input
              className="input"
              type="number"
              step="0.01"
              placeholder="Require approval above $"
              value={form.requireApprovalAbove}
              onChange={(e) => setForm({ ...form, requireApprovalAbove: e.target.value })}
            />
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10 }}>
              <Button onClick={createPolicy} variant="primary">Create</Button>
              <Button onClick={() => setShowCreate(false)} variant="secondary">Cancel</Button>
            </div>
          </div>
        )}

        {loading ? (
          <p>Loading policies...</p>
        ) : policies.length === 0 ? (
          <EmptyState
            icon={<Shield size={28} />}
            title="No policies configured"
            body="Create access policies to control what each agent can access."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Service</th>
                  <th>Methods</th>
                  <th>Paths</th>
                  <th>Rate Limit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((policy) => (
                  <tr key={policy.id}>
                    <td><strong>{getAgentName(policy.agentId)}</strong></td>
                    <td><span className="badge badge-env-production">{policy.service}</span></td>
                    <td>{policy.allowedMethods.join(", ")}</td>
                    <td><code style={{ fontSize: 12 }}>{policy.allowedPaths.join(", ")}</code></td>
                    <td>{policy.maxRequestsPerHour}/hr</td>
                    <td>
                      <Button icon={<Trash2 size={14} />} onClick={() => deletePolicy(policy.id)} size="sm" variant="danger">
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
    </div>
  );
}
