"use client";

import { Check, Copy, Eye, EyeOff, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, IconButton } from "./ui";
import { formatDate, maskSecret } from "@/lib/helpers";
import type { WorkspaceRecord } from "@/lib/types";

export function KeyTable({ compact, records }: { compact?: boolean; records: WorkspaceRecord[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Key</th>
            <th>Environment</th>
            <th>Status</th>
            <th>Owner</th>
            <th>Last Rotated</th>
            {!compact ? <th>Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <KeyRow compact={compact} key={record.id} record={record} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KeyRow({ compact, record }: { compact?: boolean; record: WorkspaceRecord }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <tr>
      <td>
        <strong>{record.service}</strong>
        <small>{record.name}</small>
      </td>
      <td>
        <code>{maskSecret(record)}</code>
      </td>
      <td>
        {record.environment}
      </td>
      <td>
        {record.status}
      </td>
      <td>{record.owner}</td>
      <td>{formatDate(record.lastRotatedAt)}</td>
      {!compact ? (
        <td>
          <div className="row-actions">
            <IconButton label="Reveal" onClick={() => {}}>
              <Eye size={16} />
            </IconButton>
            <IconButton label="Copy" onClick={() => {}}>
              <Copy size={16} />
            </IconButton>
            <div className="menu-wrap">
              <IconButton label="More" onClick={() => setMenuOpen(!menuOpen)}>
                <MoreHorizontal size={16} />
              </IconButton>
              {menuOpen ? (
                <div className="menu">
                  <button onClick={() => setMenuOpen(false)}>
                    <Eye size={14} />
                    Reveal
                  </button>
                  <button onClick={() => setMenuOpen(false)}>
                    <Copy size={14} />
                    Copy
                  </button>
                  <button className="danger" onClick={() => setMenuOpen(false)}>
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </td>
      ) : null}
    </tr>
  );
}

export function EmptyRows() {
  return (
    <div className="empty-rows">
      <p>No records to display</p>
    </div>
  );
}

export function AlertItem({ body, tone, title }: { body: string; tone: "ok" | "warning"; title: string }) {
  return (
    <div className={`alert-item alert-${tone}`}>
      <div>
        <strong>{title}</strong>
        <p>{body}</p>
      </div>
      {tone === "ok" ? <Check size={18} /> : null}
    </div>
  );
}

export function MiniChart({ records }: { records: WorkspaceRecord[] }) {
  const envCounts = records.reduce<Record<string, number>>((acc, record) => {
    acc[record.environment] = (acc[record.environment] ?? 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(envCounts);
  const max = Math.max(...entries.map(([, count]) => count), 1);

  return (
    <div className="mini-chart">
      {entries.map(([env, count]) => (
        <div className="mini-chart-bar" key={env}>
          <div className="mini-chart-fill" style={{ height: `${(count / max) * 100}%` }} />
          <span>{env}</span>
          <strong>{count}</strong>
        </div>
      ))}
    </div>
  );
}

export function StatBars({ stats }: { stats: Record<string, number> }) {
  const entries = Object.entries(stats);
  const max = Math.max(...entries.map(([, count]) => count), 1);

  if (!entries.length) {
    return <p className="muted">No data available</p>;
  }

  return (
    <div className="stat-list">
      {entries.map(([label, count]) => (
        <div className="stat-row" key={label}>
          <span>{label}</span>
          <div className="stat-bar">
            <div className="stat-fill" style={{ width: `${(count / max) * 100}%` }} />
          </div>
          <strong>{count}</strong>
        </div>
      ))}
    </div>
  );
}

export function PolicyItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="policy-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function Toast({ message }: { message: string }) {
  return (
    <div className="toast">
      <Check size={18} />
      <span>{message}</span>
    </div>
  );
}
