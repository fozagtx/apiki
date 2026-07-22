"use client";

import { Shield, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, EmptyState, Field, Panel, PanelHeader, SelectField } from "./ui";

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
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    agentId: "",
    service: "",
    allowedMethods: "*",
    allowedPaths: "*",
    maxRequestsPerHour: "60",
    requireApprovalAbove: "0",
  });

  const loadData = async () => {
    try {
      const [agentsRes, policiesRes] = await Promise.all([
        fetch("/api/agents"),
        fetch("/api/policies"),
      ]);
      const agentsData = await agentsRes.json();
      const policiesData = await policiesRes.json();
      if (!agentsRes.ok) throw new Error(agentsData.error || "Could not load agents.");
      if (!policiesRes.ok) throw new Error(policiesData.error || "Could not load policies.");
      setAgents(agentsData.agents || []);
      setPolicies(policiesData.policies || []);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load policies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const createPolicy = async () => {
    if (!form.agentId || !form.service) return;
    setError("");
    const res = await fetch("/api/policies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: form.agentId,
        service: form.service.trim().toLowerCase(),
        allowedMethods: form.allowedMethods.split(",").map((m) => m.trim()).filter(Boolean),
        allowedPaths: form.allowedPaths.split(",").map((p) => p.trim()).filter(Boolean),
        maxRequestsPerHour: parseInt(form.maxRequestsPerHour, 10) || 60,
        requireApprovalAbove: parseFloat(form.requireApprovalAbove) || 0,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Could not create policy.");
      return;
    }
    setShowCreate(false);
    setForm({
      agentId: "",
      service: "",
      allowedMethods: "*",
      allowedPaths: "*",
      maxRequestsPerHour: "60",
      requireApprovalAbove: "0",
    });
    await loadData();
  };

  const deletePolicy = async (id: string) => {
    if (!confirm("Delete this policy?")) return;
    await fetch(`/api/policies?id=${id}`, { method: "DELETE" });
    await loadData();
  };

  const getAgentName = (agentId: string) => {
    return agents.find((a) => a.id === agentId)?.name || agentId;
  };

  return (
    <div className="page-stack">
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
            <SelectField
              id="policy-agent"
              label="Agent"
              value={form.agentId}
              onChange={(e) => setForm({ ...form, agentId: e.target.value })}
            >
              <option value="">Select agent...</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.id})</option>
              ))}
            </SelectField>
            <Field
              id="policy-service"
              label="Service"
              placeholder="e.g. vercel, openai, github"
              value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value })}
            />
            <Field
              id="policy-methods"
              label="Methods"
              placeholder="GET,POST or *"
              value={form.allowedMethods}
              onChange={(e) => setForm({ ...form, allowedMethods: e.target.value })}
            />
            <Field
              id="policy-paths"
              label="Paths"
              placeholder="/v9/* or *"
              value={form.allowedPaths}
              onChange={(e) => setForm({ ...form, allowedPaths: e.target.value })}
            />
            <Field
              id="policy-rate"
              label="Max requests/hour"
              type="number"
              value={form.maxRequestsPerHour}
              onChange={(e) => setForm({ ...form, maxRequestsPerHour: e.target.value })}
            />
            <Field
              id="policy-approval"
              label="Require approval above $"
              type="number"
              step="0.01"
              value={form.requireApprovalAbove}
              onChange={(e) => setForm({ ...form, requireApprovalAbove: e.target.value })}
            />
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10 }}>
              <Button onClick={createPolicy} variant="primary">Create</Button>
              <Button onClick={() => setShowCreate(false)} variant="secondary">Cancel</Button>
            </div>
          </div>
        )}

        {error ? <p className="dialog-error">{error}</p> : null}

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
                    <td>{policy.service}</td>
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
