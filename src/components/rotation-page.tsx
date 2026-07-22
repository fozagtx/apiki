"use client";

import { CalendarClock, RefreshCw, ShieldAlert } from "lucide-react";
import { useMemo } from "react";
import { daysUntil, formatDate, isRotationDue, nextRotationAt } from "@/lib/helpers";
import type { WorkspaceRecord } from "@/lib/types";
import { useWorkspace } from "./workspace-provider";
import { Button, EmptyState, Panel, PanelHeader } from "./ui";
import { PolicyItem } from "./shared-components";

export function RotationPage() {
  const { workspace, updateWorkspace } = useWorkspace();
  const sortedRecords = useMemo(() => [...workspace!.records].sort((a, b) => nextRotationAt(a).getTime() - nextRotationAt(b).getTime()), [workspace]);

  const markRotated = (record: WorkspaceRecord) => {
    updateWorkspace(
      (current) => ({
        ...current,
        records: current.records.map((r) => r.id === record.id ? { ...r, lastRotatedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: "active" } : r),
      }),
      `${record.service} marked as rotated`,
    );
  };

  return (
    <div className="page-stack">
      <Panel>
        <PanelHeader icon={<CalendarClock size={18} />} title="Rotation Schedule" />
        {sortedRecords.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Service</th><th>Environment</th><th>Interval</th><th>Last Rotated</th><th>Next Due</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {sortedRecords.map((record) => {
                  const next = nextRotationAt(record);
                  const due = isRotationDue(record);
                  return (
                    <tr key={record.id}>
                      <td><strong>{record.service}</strong><small>{record.name}</small></td>
                      <td>{record.environment}</td>
                      <td>{record.rotationIntervalDays} days</td>
                      <td>{formatDate(record.lastRotatedAt)}</td>
                      <td className={due ? "overdue" : ""}>{due ? "Overdue" : `${daysUntil(next)} days`}<small>{formatDate(next.toISOString())}</small></td>
                      <td>{due ? "Due" : record.status}</td>
                      <td><Button onClick={() => markRotated(record)} size="sm" variant="secondary"><RefreshCw size={14} /> Mark Rotated</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<RefreshCw size={28} />} title="No rotation schedule yet" body="Add keys with rotation intervals to build a schedule." />
        )}
      </Panel>
      <Panel>
        <PanelHeader icon={<ShieldAlert size={18} />} title="Rotation Policy" />
        <div className="policy-list">
          <PolicyItem label="Recommended interval" value="60-90 days" />
          <PolicyItem label="Production priority" value="Highest" />
          <PolicyItem label="Overdue definition" value="Past next due date" />
          <PolicyItem label="Hosted automation" value="Not connected" />
        </div>
      </Panel>
    </div>
  );
}
