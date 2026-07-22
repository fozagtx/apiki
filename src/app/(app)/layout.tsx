"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { AddKeyDialog } from "@/components/add-key-dialog";
import { McpSetupDialog } from "@/components/mcp-setup-dialog";
import { Toast } from "@/components/shared-components";
import { WorkspaceLoading } from "@/components/workspace-gate";
import { useWorkspace } from "@/components/workspace-provider";
import { ensureCodexAccess, type McpSetupResult } from "@/lib/mcp-setup";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { workspace, cryptoKey, unlocked, isWorkspaceLoading, isAddOpen, setAddOpen, updateWorkspace, toast, setToast } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const [mcpSetup, setMcpSetup] = useState<McpSetupResult | null>(null);

  useEffect(() => {
    if (!isWorkspaceLoading && !unlocked) {
      router.replace("/login");
    }
  }, [isWorkspaceLoading, unlocked, router]);

  if (isWorkspaceLoading) {
    return <WorkspaceLoading />;
  }

  if (!unlocked) {
    return null;
  }

  return (
    <>
      <AppShell currentPath={pathname}>{children}</AppShell>
      <AddKeyDialog
        open={isAddOpen}
        workspace={workspace!}
        cryptoKey={cryptoKey!}
        onClose={() => setAddOpen(false)}
        onCreate={async (record) => {
          await updateWorkspace(
            (current) => ({ ...current, records: [record, ...current.records] }),
            "API key encrypted and saved",
          );
          setAddOpen(false);
          try {
            const setup = await ensureCodexAccess(record.service);
            setMcpSetup(setup);
            setToast("Codex agent + policy ready. Copy the MCP config.");
          } catch (caught) {
            setToast(caught instanceof Error ? caught.message : "Key saved, but Codex setup failed.");
            router.push("/keys");
          }
        }}
      />
      {mcpSetup ? (
        <McpSetupDialog
          setup={mcpSetup}
          onClose={() => {
            setMcpSetup(null);
            router.push("/agents");
          }}
        />
      ) : null}
      {toast ? <Toast message={toast} /> : null}
    </>
  );
}
