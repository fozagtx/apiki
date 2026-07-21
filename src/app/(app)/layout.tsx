"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { AddKeyDialog } from "@/components/add-key-dialog";
import { Toast } from "@/components/shared-components";
import { WorkspaceLoading } from "@/components/workspace-gate";
import { useWorkspace } from "@/components/workspace-provider";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { workspace, cryptoKey, unlocked, isWorkspaceLoading, isAddOpen, setAddOpen, updateWorkspace, toast } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();

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
            "API key encrypted and saved to Neon",
          );
          setAddOpen(false);
          router.push("/keys");
        }}
      />
      {toast ? <Toast message={toast} /> : null}
    </>
  );
}
