"use client";

import { Clipboard, DatabaseZap, Lock, Shield, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/helpers";
import { useWorkspace } from "./workspace-provider";
import { Button, LiveBanner, Panel, PanelHeader, StatusLine } from "./ui";

export function SettingsPage() {
  const { workspace, lockWorkspace, resetWorkspaceAction, setToast } = useWorkspace();
  const router = useRouter();

  const exportMetadata = () => {
    const exportData = {
      meta: workspace!.meta,
      monitoring: workspace!.monitoring,
      records: workspace!.records.map((record) => ({
        id: record.id,
        service: record.service,
        name: record.name,
        environment: record.environment,
        status: record.status,
        owner: record.owner,
        description: record.description,
        website: record.website,
        docsUrl: record.docsUrl,
        monthlyLimit: record.monthlyLimit,
        monthlyCost: record.monthlyCost,
        rotationIntervalDays: record.rotationIntervalDays,
        lastRotatedAt: record.lastRotatedAt,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      })),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `apiki-metadata-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast("Metadata exported (secrets excluded)");
  };

  const handleReset = async () => {
    await resetWorkspaceAction();
    router.push("/");
  };

  return (
    <div className="page-stack">
      <LiveBanner />
      <section className="split-grid">
        <Panel>
          <PanelHeader icon={<DatabaseZap size={18} />} title="Workspace Details" />
          <div className="status-list">
            <StatusLine icon={<Shield size={18} />} label="Workspace name" value={workspace!.meta.workspaceName} />
            <StatusLine icon={<Clipboard size={18} />} label="Owner" value={workspace!.meta.ownerEmail} />
            <StatusLine icon={<DatabaseZap size={18} />} label="Created" value={formatDate(workspace!.meta.createdAt)} />
            <StatusLine icon={<Lock size={18} />} label="Encrypted records" value={String(workspace!.records.length)} />
          </div>
        </Panel>
        <Panel>
          <PanelHeader icon={<Lock size={18} />} title="Security Controls" />
          <div className="settings-actions">
            <Button icon={<Lock size={18} />} onClick={lockWorkspace} variant="secondary">Lock Workspace</Button>
            <Button icon={<Clipboard size={18} />} onClick={exportMetadata} variant="secondary">Export Metadata</Button>
            <Button icon={<Trash2 size={18} />} onClick={handleReset} variant="danger">Reset Workspace</Button>
          </div>
          <p className="settings-note">Metadata export excludes decrypted API key values. Reset removes the encrypted workspace records from Neon.</p>
        </Panel>
      </section>
    </div>
  );
}
