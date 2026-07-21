"use client";

import { KeysPage } from "@/components/keys-page";
import { useWorkspace } from "@/components/workspace-provider";

export default function KeysRoute() {
  const { setAddOpen } = useWorkspace();
  return <KeysPage onAddKey={() => setAddOpen(true)} />;
}
