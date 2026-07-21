"use client";

import { ChevronDown, Copy, Eye, EyeOff, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { decryptString } from "@/lib/crypto";
import { ENVIRONMENTS, type Environment, type WorkspaceEnvelope, type WorkspaceRecord } from "@/lib/types";
import { useWorkspace } from "./workspace-provider";
import { Button, EmptyState, IconButton, LiveBanner, Panel } from "./ui";
import { KeyTable } from "./shared-components";

export function KeysPage({ onAddKey }: { onAddKey: () => void }) {
  const { workspace, cryptoKey, updateWorkspace, setToast } = useWorkspace();
  const [query, setQuery] = useState("");
  const [environment, setEnvironment] = useState<"All" | Environment>("All");
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState("");

  const filtered = workspace!.records.filter((record) => {
    const text = `${record.service} ${record.name} ${record.owner} ${record.environment}`.toLowerCase();
    const matchesQuery = text.includes(query.toLowerCase());
    const matchesEnvironment = environment === "All" || record.environment === environment;
    return matchesQuery && matchesEnvironment;
  });

  const revealRecord = async (record: WorkspaceRecord) => {
    setBusyId(record.id);
    try {
      if (revealed[record.id]) {
        setRevealed((current) => { const next = { ...current }; delete next[record.id]; return next; });
        return;
      }
      const value = await decryptString(cryptoKey!, record.iv, record.cipherText);
      setRevealed((current) => ({ ...current, [record.id]: value }));
    } catch { setToast("Could not decrypt that key with the current workspace key"); }
    finally { setBusyId(""); }
  };

  const copyRecord = async (record: WorkspaceRecord) => {
    setBusyId(record.id);
    try {
      const value = revealed[record.id] ?? (await decryptString(cryptoKey!, record.iv, record.cipherText));
      await navigator.clipboard.writeText(value);
      setToast("API key copied to clipboard");
    } catch { setToast("Clipboard or decryption failed"); }
    finally { setBusyId(""); }
  };

  const deleteRecord = (record: WorkspaceRecord) => {
    const confirmed = window.confirm(`Delete ${record.service} / ${record.name}? This removes the encrypted record from Neon.`);
    if (!confirmed) return;
    updateWorkspace((current) => ({ ...current, records: current.records.filter((item) => item.id !== record.id) }));
    setToast("Encrypted record deleted from Neon");
  };

  const markRotated = (record: WorkspaceRecord) => {
    updateWorkspace(
      (current) => ({
        ...current,
        records: current.records.map((r) =>
          r.id === record.id
            ? { ...r, lastRotatedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: "rotating" }
            : r
        ),
      }),
      "Rotation metadata updated"
    );
  };

  return (
    <div className="page-stack">
      <LiveBanner />
      <Panel>
        <div className="table-toolbar">
          <div className="search-field">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your saved records..." />
          </div>
          <label className="select-field">
            <span>Environment</span>
            <select value={environment} onChange={(event) => setEnvironment(event.target.value as "All" | Environment)}>
              <option>All</option>
              {ENVIRONMENTS.map((item) => (<option key={item}>{item}</option>))}
            </select>
            <ChevronDown size={16} />
          </label>
          <Button icon={<Plus size={18} />} onClick={onAddKey} variant="primary">Add API Key</Button>
        </div>
        {filtered.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Service</th><th>Key</th><th>Environment</th><th>Status</th><th>Owner</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => (
                  <tr key={record.id}>
                    <td><strong>{record.service}</strong><small>{record.name}</small></td>
                    <td><code>{revealed[record.id] ? revealed[record.id] : `${record.service.toLowerCase().replace(/[^a-z]/g, "").slice(0, 2) || "sk"}-\u2022\u2022\u2022\u2022\u2022\u2022\u2022${record.id.slice(-4)}`}</code></td>
                    <td><span className={`badge badge-env-${record.environment.toLowerCase()}`}>{record.environment}</span></td>
                    <td><span className={`badge badge-status-${record.status}`}>{record.status}</span></td>
                    <td>{record.owner}</td>
                    <td>
                      <div className="row-actions">
                        <IconButton label={revealed[record.id] ? "Hide" : "Reveal"} onClick={() => revealRecord(record)} disabled={busyId === record.id}>
                          {revealed[record.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </IconButton>
                        <IconButton label="Copy" onClick={() => copyRecord(record)} disabled={busyId === record.id}><Copy size={16} /></IconButton>
                        <IconButton label="Mark rotated" onClick={() => markRotated(record)}><RefreshCw size={16} /></IconButton>
                        <IconButton label="Delete" onClick={() => deleteRecord(record)}><Trash2 size={16} /></IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Eye size={28} />} title="No matching records" body="Adjust your filters or add a new encrypted key record." actionLabel="Add API Key" onAction={onAddKey} />
        )}
      </Panel>
    </div>
  );
}
