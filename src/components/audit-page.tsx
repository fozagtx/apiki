"use client";

import { ScrollText } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState, Panel, PanelHeader } from "./ui";

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
    void loadLogs();
  }, []);

  return (
    <div className="page-stack">
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
                    <td>{entry.action}</td>
                    <td>{entry.service}</td>
                    <td>{entry.method || "—"}</td>
                    <td><code style={{ fontSize: 12 }}>{entry.path || "—"}</code></td>
                    <td>{entry.status}</td>
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
