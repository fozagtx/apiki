"use client";

import { LandingPage } from "@/components/landing-page";
import { Toast } from "@/components/shared-components";
import { useWorkspace } from "@/components/workspace-provider";

export default function Page() {
  const { workspace, unlocked, toast } = useWorkspace();
  return (
    <>
      <LandingPage workspace={workspace} unlocked={unlocked} />
      {toast ? <Toast message={toast} /> : null}
    </>
  );
}
