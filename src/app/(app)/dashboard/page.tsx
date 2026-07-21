"use client";

import { DashboardPage } from "@/components/dashboard-page";
import { useWorkspace } from "@/components/workspace-provider";

export default function DashboardRoute() {
  const { setAddOpen } = useWorkspace();
  return <DashboardPage onAddKey={() => setAddOpen(true)} />;
}
