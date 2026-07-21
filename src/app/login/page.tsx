"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { WorkspaceGate, WorkspaceLoading } from "@/components/workspace-gate";
import { Toast } from "@/components/shared-components";
import { useWorkspace } from "@/components/workspace-provider";

export default function LoginPage() {
  const { apiStatus, workspace, isWorkspaceLoading, unlocked, persistWorkspace, setCryptoKey, setToast, toast } = useWorkspace();
  const router = useRouter();

  useEffect(() => {
    if (unlocked) {
      router.replace("/dashboard");
    }
  }, [unlocked, router]);

  if (isWorkspaceLoading) {
    return <WorkspaceLoading />;
  }

  return (
    <>
      <WorkspaceGate
        apiStatus={apiStatus}
        workspace={workspace}
        onCreate={async (nextWorkspace, key) => {
          await persistWorkspace(nextWorkspace, "Encrypted workspace created in Neon");
          setCryptoKey(key);
          router.push("/dashboard");
        }}
        onUnlock={(key) => {
          setCryptoKey(key);
          setToast("Workspace unlocked");
          router.push("/dashboard");
        }}
      />
      {toast ? <Toast message={toast} /> : null}
    </>
  );
}
