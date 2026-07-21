import type { LiveStatus, WorkspaceEnvelope } from "./types";

export async function loadWorkspace(): Promise<WorkspaceEnvelope | null> {
  const response = await fetch("/api/workspace", { cache: "no-store" });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(typeof payload.message === "string" ? payload.message : "Could not load the live workspace.");
  }

  return (payload.workspace ?? null) as WorkspaceEnvelope | null;
}

export async function saveWorkspace(workspace: WorkspaceEnvelope): Promise<WorkspaceEnvelope | null> {
  const response = await fetch("/api/workspace", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(workspace),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(typeof payload.message === "string" ? payload.message : "Could not save the live workspace.");
  }

  return (payload.workspace ?? null) as WorkspaceEnvelope | null;
}

export async function deleteWorkspace() {
  const response = await fetch("/api/workspace", { method: "DELETE" });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(typeof payload.message === "string" ? payload.message : "Could not reset the live workspace.");
  }
}

export async function loadApiStatus(): Promise<LiveStatus> {
  const response = await fetch("/api/health", { cache: "no-store" });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      state: payload.status === "unconfigured" ? "unconfigured" : "error",
      message: typeof payload.message === "string" ? payload.message : "Neon database is unavailable.",
    };
  }

  return { state: "ready", message: "Neon database connected." };
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}
