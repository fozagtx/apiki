import type { WorkspaceEnvelope, WorkspaceRecord } from "./types";

export function calculateMetrics(workspace: WorkspaceEnvelope) {
  const active = workspace.records.filter((record) => record.status === "active").length;
  const inactive = workspace.records.filter((record) => record.status === "inactive" || record.status === "revoked").length;
  const rotationDue = recordsDueForRotation(workspace.records).length;
  const monthlyCost = workspace.records.reduce((sum, record) => sum + record.monthlyCost, 0);
  const penalties = rotationDue * 8 + inactive * 4 + (workspace.records.filter((record) => !record.docsUrl).length > 0 ? 6 : 0);
  return {
    active,
    inactive,
    rotationDue,
    monthlyCost: monthlyCost.toFixed(2),
    securityScore: Math.max(0, Math.min(100, 100 - penalties)),
  };
}

export function recordsDueForRotation(records: WorkspaceRecord[]) {
  return records.filter(isRotationDue);
}

export function nextRotationAt(record: WorkspaceRecord) {
  const next = new Date(record.lastRotatedAt);
  next.setDate(next.getDate() + record.rotationIntervalDays);
  return next;
}

export function isRotationDue(record: WorkspaceRecord) {
  return nextRotationAt(record).getTime() < Date.now();
}

export function daysUntil(date: Date) {
  const ms = date.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function countBy<T extends object>(items: T[], field: keyof T) {
  return items.reduce<Record<string, number>>((stats, item) => {
    const value = String(item[field]);
    stats[value] = (stats[value] ?? 0) + 1;
    return stats;
  }, {});
}

export function topServices(records: WorkspaceRecord[]) {
  const stats = countBy(records, "service");
  return Object.entries(stats)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export function buildMonitoringChecks(workspace: WorkspaceEnvelope) {
  const metrics = calculateMetrics(workspace);
  const missingDocs = workspace.records.filter((record) => !record.docsUrl).length;
  const highCost = workspace.records.filter((record) => record.monthlyCost >= 100).length;
  return [
    {
      title: "Rotation health",
      body: metrics.rotationDue
        ? `${metrics.rotationDue} key records are past their rotation date.`
        : "No stored records are overdue for rotation.",
      ok: metrics.rotationDue === 0,
      tone: metrics.rotationDue === 0 ? "ok" : "warning",
    },
    {
      title: "Documentation coverage",
      body: missingDocs ? `${missingDocs} records are missing API documentation links.` : "Every record has documentation metadata.",
      ok: missingDocs === 0,
      tone: missingDocs === 0 ? "ok" : "warning",
    },
    {
      title: "Inactive key review",
      body: metrics.inactive ? `${metrics.inactive} inactive or revoked records remain in the workspace.` : "No inactive records need review.",
      ok: metrics.inactive === 0,
      tone: metrics.inactive === 0 ? "ok" : "warning",
    },
    {
      title: "Cost threshold",
      body: highCost ? `${highCost} records have monthly cost estimates at or above $100.` : "No high-cost records detected.",
      ok: highCost === 0,
      tone: highCost === 0 ? "ok" : "warning",
    },
  ];
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function maskSecret(record: WorkspaceRecord) {
  const prefix = record.service.toLowerCase().replace(/[^a-z]/g, "").slice(0, 2) || "sk";
  return `${prefix}-••••••••${record.id.slice(-4)}`;
}

export function initials(value: string) {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
