"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { deleteWorkspace, getErrorMessage, loadApiStatus, loadWorkspace, saveWorkspace } from "@/lib/api";
import type { LiveStatus, WorkspaceEnvelope } from "@/lib/types";

type WorkspaceContextValue = {
  workspace: WorkspaceEnvelope | null;
  setWorkspace: (workspace: WorkspaceEnvelope | null) => void;
  cryptoKey: CryptoKey | null;
  setCryptoKey: (key: CryptoKey | null) => void;
  apiStatus: LiveStatus;
  setApiStatus: (status: LiveStatus) => void;
  isWorkspaceLoading: boolean;
  unlocked: boolean;
  toast: string;
  setToast: (message: string) => void;
  isAddOpen: boolean;
  setAddOpen: (open: boolean) => void;
  refreshWorkspace: () => Promise<void>;
  persistWorkspace: (next: WorkspaceEnvelope, successMessage?: string) => Promise<WorkspaceEnvelope>;
  updateWorkspace: (updater: (current: WorkspaceEnvelope) => WorkspaceEnvelope, successMessage?: string) => Promise<boolean>;
  resetWorkspaceAction: () => Promise<void>;
  lockWorkspace: () => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<WorkspaceEnvelope | null>(null);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [isWorkspaceLoading, setWorkspaceLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<LiveStatus>({ state: "loading", message: "Connecting to Neon..." });
  const [isAddOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState("");

  const refreshWorkspace = useCallback(async () => {
    setWorkspaceLoading(true);
    try {
      const [status, nextWorkspace] = await Promise.all([loadApiStatus(), loadWorkspace()]);
      setApiStatus(status);
      setWorkspace(nextWorkspace);
    } catch (caught) {
      setApiStatus({ state: "error", message: getErrorMessage(caught, "Could not reach the live workspace.") });
      setWorkspace(null);
    } finally {
      setWorkspaceLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshWorkspace();
  }, [refreshWorkspace]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const persistWorkspace = useCallback(async (nextWorkspace: WorkspaceEnvelope, successMessage?: string) => {
    const savedWorkspace = await saveWorkspace(nextWorkspace);
    setWorkspace(savedWorkspace ?? nextWorkspace);
    setApiStatus({ state: "ready", message: "Neon database connected." });
    if (successMessage) setToast(successMessage);
    return savedWorkspace ?? nextWorkspace;
  }, []);

  const updateWorkspace = useCallback(
    async (updater: (current: WorkspaceEnvelope) => WorkspaceEnvelope, successMessage?: string) => {
      if (!workspace) return false;
      const previousWorkspace = workspace;
      const nextWorkspace = updater(workspace);
      setWorkspace(nextWorkspace);
      try {
        await persistWorkspace(nextWorkspace, successMessage);
        return true;
      } catch (caught) {
        setWorkspace(previousWorkspace);
        setApiStatus({ state: "error", message: getErrorMessage(caught, "Could not save the live workspace.") });
        setToast(getErrorMessage(caught, "Could not save the live workspace."));
        return false;
      }
    },
    [workspace, persistWorkspace],
  );

  const lockWorkspace = useCallback(() => {
    setCryptoKey(null);
    setToast("Workspace locked");
  }, []);

  const resetWorkspaceAction = useCallback(async () => {
    const confirmed = window.confirm("Reset the live workspace? This removes encrypted records from Neon.");
    if (!confirmed) return;
    try {
      await deleteWorkspace();
      setWorkspace(null);
      setCryptoKey(null);
      setToast("Live workspace reset");
    } catch (caught) {
      setToast(getErrorMessage(caught, "Could not reset the live workspace."));
    }
  }, []);

  const unlocked = Boolean(workspace && cryptoKey);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspace,
      setWorkspace,
      cryptoKey,
      setCryptoKey,
      apiStatus,
      setApiStatus,
      isWorkspaceLoading,
      unlocked,
      toast,
      setToast,
      isAddOpen,
      setAddOpen,
      refreshWorkspace,
      persistWorkspace,
      updateWorkspace,
      resetWorkspaceAction,
      lockWorkspace,
    }),
    [workspace, cryptoKey, apiStatus, isWorkspaceLoading, unlocked, toast, isAddOpen, refreshWorkspace, persistWorkspace, updateWorkspace, resetWorkspaceAction, lockWorkspace],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
