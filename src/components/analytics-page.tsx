"use client";

import { Activity, AlertTriangle, BarChart3, Gauge, Layers, Shield } from "lucide-react";
import { calculateMetrics, countBy, topServices } from "@/lib/helpers";
import { useWorkspace } from "./workspace-provider";
import { EmptyState, LiveBanner, MetricCard, Panel, PanelHeader } from "./ui";
import { StatBars } from "./shared-components";

export function AnalyticsPage() {
  const { workspace } = useWorkspace();
  const metrics = calculateMetrics(workspace!);
  const envStats = countBy(workspace!.records, "environment");
  const statusStats = countBy(workspace!.records, "status");
  const serviceStats = topServices(workspace!.records);

  return (
    <div className="page-stack">
      <LiveBanner />
      <section className="metric-grid">
        <MetricCard label="Tracked Services" value={String(serviceStats.length)} icon={<Layers size={20} />} />
        <MetricCard label="Monthly Cost" value={`$${metrics.monthlyCost}`} icon={<Activity size={20} />} />
        <MetricCard label="Prod Keys" value={String(envStats.Production ?? 0)} icon={<Shield size={20} />} />
        <MetricCard label="Inactive Keys" value={String(metrics.inactive)} icon={<AlertTriangle size={20} />} />
      </section>
      <section className="analytics-grid">
        <Panel>
          <PanelHeader icon={<BarChart3 size={18} />} title="Environment Mix" />
          <StatBars stats={envStats} />
        </Panel>
        <Panel>
          <PanelHeader icon={<Activity size={18} />} title="Status Breakdown" />
          <StatBars stats={statusStats} />
        </Panel>
        <Panel className="wide-panel">
          <PanelHeader icon={<Gauge size={18} />} title="Top Services By Stored Keys" />
          {serviceStats.length ? (
            <div className="service-list">
              {serviceStats.map((item) => (
                <div className="service-row" key={item.label}>
                  <span className="service-dot" />
                  <strong>{item.label}</strong>
                  <span>{item.count} keys</span>
                  <meter min={0} max={Math.max(...serviceStats.map((stat) => stat.count))} value={item.count} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<BarChart3 size={28} />} title="No analytics yet" body="Analytics are generated from workspace key metadata." />
          )}
        </Panel>
      </section>
    </div>
  );
}
