"use client";

import { AlertTriangle, BarChart3, KeyRound, RefreshCw, Shield, WalletCards, Zap } from "lucide-react";
import { useMemo } from "react";
import { calculateMetrics, formatDate, recordsDueForRotation } from "@/lib/helpers";
import { useWorkspace } from "./workspace-provider";
import { Button, EmptyState, MetricCard, Panel, PanelHeader } from "./ui";
import { AlertItem, EmptyRows, KeyTable, MiniChart } from "./shared-components";

export function DashboardPage({ onAddKey }: { onAddKey: () => void }) {
  const { workspace } = useWorkspace();
  const metrics = useMemo(() => calculateMetrics(workspace!), [workspace]);
  const dueRecords = useMemo(() => recordsDueForRotation(workspace!.records), [workspace]);
  const recentRecords = workspace!.records.slice(0, 5);

  return (
    <div className="page-stack">
            <section className="metric-grid">
        <MetricCard label="Total API Keys" value={String(workspace!.records.length)} icon={<KeyRound size={20} />} />
        <MetricCard label="Active Keys" value={String(metrics.active)} icon={<Zap size={20} />} />
        <MetricCard label="Due Rotations" value={String(metrics.rotationDue)} icon={<RefreshCw size={20} />} />
        <MetricCard label="Security Score" value={`${metrics.securityScore}%`} icon={<Shield size={20} />} />
      </section>

      <section className="dashboard-grid">
        <Panel className="analytics-panel">
          <PanelHeader icon={<BarChart3 size={18} />} title="API Key Analytics" action={<a href="/analytics" className="button small-button">View Analytics</a>} />
          {workspace!.records.length ? (
            <MiniChart records={workspace!.records} />
          ) : (
            <EmptyState icon={<KeyRound size={28} />} title="No keys stored yet" body="Create your first encrypted key record to populate dashboard analytics." actionLabel="Add API Key" onAction={onAddKey} />
          )}
        </Panel>

        <Panel>
          <PanelHeader icon={<AlertTriangle size={18} />} title="Recent Alerts" />
          {dueRecords.length ? (
            <div className="alert-list">
              {dueRecords.slice(0, 4).map((record) => (
                <AlertItem key={record.id} tone="warning" title={`${record.service} rotation due`} body={`Last rotated ${formatDate(record.lastRotatedAt)}.`} />
              ))}
            </div>
          ) : (
            <EmptyState icon={<Shield size={28} />} title="No workspace alerts" body="Your stored records have no overdue rotation checks." />
          )}
        </Panel>
      </section>

      <Panel>
        <PanelHeader icon={<WalletCards size={18} />} title="Recent API Keys" action={<a href="/keys" className="button small-button">Manage Keys</a>} />
        {recentRecords.length ? <KeyTable records={recentRecords} compact /> : <EmptyRows />}
      </Panel>
    </div>
  );
}
