"use client";

import { Bell, MonitorCheck, ShieldAlert } from "lucide-react";
import { buildMonitoringChecks } from "@/lib/helpers";
import type { MonitoringPrefs } from "@/lib/types";
import { useWorkspace } from "./workspace-provider";
import { EmptyState, IconButton, LiveBanner, Panel, PanelHeader } from "./ui";
import { AlertItem } from "./shared-components";

export function MonitoringPage() {
  const { workspace, updateWorkspace } = useWorkspace();
  const checks = buildMonitoringChecks(workspace!);

  const toggle = (key: keyof MonitoringPrefs) => {
    updateWorkspace((current) => ({
      ...current,
      monitoring: { ...current.monitoring, [key]: !current.monitoring[key] },
    }));
  };

  return (
    <div className="page-stack">
      <LiveBanner />
      <section className="split-grid">
        <Panel>
          <PanelHeader icon={<MonitorCheck size={18} />} title="Workspace Risk Checks" />
          {checks.length ? (
            <div className="alert-list">
              {checks.map((check) => (
                <AlertItem key={check.title} tone={check.tone as "ok" | "warning"} title={check.title} body={check.body} />
              ))}
            </div>
          ) : (
            <EmptyState icon={<ShieldAlert size={28} />} title="No monitoring data" body="Add keys to your workspace to generate risk checks." />
          )}
        </Panel>
        <Panel>
          <PanelHeader icon={<Bell size={18} />} title="Monitoring Rules" />
          <div className="rule-list">
            {([
              ["rotation", "Overdue rotation alerts"],
              ["docs", "Missing documentation alerts"],
              ["inactive", "Inactive key alerts"],
              ["cost", "High-cost key alerts"],
            ] as const).map(([key, label]) => (
              <div className="rule-row" key={key}>
                <div>
                  <strong>{label}</strong>
                  <small>Hosted alerts are not connected yet</small>
                </div>
                <button aria-label={`Toggle ${label}`} className={`toggle ${workspace!.monitoring[key] ? "active" : ""}`} onClick={() => toggle(key)} type="button">
                  <span />
                </button>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
