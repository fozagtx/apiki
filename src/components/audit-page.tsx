"use client";

import { ScrollText } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState, LiveBanner, Panel, PanelHeader } from "./ui";

type AuditEntry = {
  id: string;
  timestamp: string;
  agentId: string;
  service: string;
  action: string;
  method?: string;
  path?: string;
  status: string;
};

export function AuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      const res = await fetch("/api/audit?limit=100");
      const data = await res.json();
      setLogs(data.logs || []);
      setLoading(false);
    };
    loadLogs();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "allowed":
        return "badge-status-active";
      case "denied":
        return "badge-status-revoked";
      case "approved":
        return "badge-status-rotating";
      default:
        return "";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "api_call":
        return "🌐";
      case "command_exec":
        return "⚡";
      case "env_inject":
        return "🔑";
      case "token_create":
        return "🎟️";
      default:
        return "📝";
    }
  };

  return (
    <div className="page-stack">
      <LiveBanner />
      <Panel>
        <PanelHeader icon={<ScrollText size={18} />} title="Access Audit Log" />

        {loading ? (
          <p>Loading audit log...</p>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={<ScrollText size={28} />}
            title="No audit entries yet"
            body="Audit entries will appear here when agents access APIs through Apiki."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Agent</th>
                  <th>Action</th>
                  <th>Service</th>
                  <th>Method</th>
                  <th>Path</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td><strong>{entry.agentId}</strong></td>
                    <td>
                      <span style={{ marginRight: 6 }}>{getActionIcon(entry.action)}</span>
                      {entry.action}
                    </td>
                    <td><span className="badge badge-env-production">{entry.service}</span></td>
                    <td>{entry.method || "—"}</td>
                    <td><code style={{ fontSize: 12 }}>{entry.path || "—"}</code></td>
                    <td>
                      <span className={`badge ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
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
