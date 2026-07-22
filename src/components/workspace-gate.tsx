"use client";

import { CloudOff, DatabaseZap, Eye, EyeOff, LockKeyhole, Shield } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { createWorkspace, unlockWorkspace } from "@/lib/crypto";
import type { LiveStatus, WorkspaceEnvelope } from "@/lib/types";
import { Button, EmptyState, Field, IconTile, StatusLine } from "./ui";

function LogoMark() {
  return <img alt="" className="brand-logo" src="/apiki-logo.png" />;
}

export function WorkspaceGate({
  apiStatus,
  workspace,
  onCreate,
  onUnlock,
}: {
  apiStatus: LiveStatus;
  workspace: WorkspaceEnvelope | null;
  onCreate: (workspace: WorkspaceEnvelope, key: CryptoKey) => Promise<void> | void;
  onUnlock: (key: CryptoKey) => void;
}) {
  const [mode, setMode] = useState<"unlock" | "create">(workspace ? "unlock" : "create");
  const [workspaceName, setWorkspaceName] = useState("Personal Workspace");
  const [passphrase, setPassphrase] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMode(workspace ? "unlock" : "create");
  }, [workspace]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "create") {
        if (!workspaceName.trim()) throw new Error("Workspace name is required.");
        if (passphrase.length < 10) throw new Error("Use at least 10 characters for the workspace passphrase.");
        if (passphrase !== confirm) throw new Error("Passphrases do not match.");
        const { envelope, key } = await createWorkspace({
          workspaceName: workspaceName.trim(),
          passphrase,
          records: [],
        });
        await onCreate(envelope, key);
      } else if (workspace) {
        const key = await unlockWorkspace(workspace, passphrase);
        onUnlock(key);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Workspace operation failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="gate-page">
      <a href="/" className="brand-button gate-brand"><span className="brand-mark"><LogoMark /></span><span>Apiki</span></a>
      <main className="gate-layout">
        <section className="gate-copy">
          <h1>{workspace ? "Unlock your Apiki workspace" : "Create your Apiki workspace"}</h1>
          <p>
            {workspace
              ? "Enter your passphrase to decrypt the workspace key in this browser."
              : "Set a passphrase to derive an encryption key. Secrets are encrypted before they reach SQLite."}
          </p>
          <div className="gate-status">
            <StatusLine icon={<DatabaseZap size={18} />} label="Database" value={apiStatus.message} />
            <StatusLine icon={workspace ? <LockKeyhole size={18} /> : <CloudOff size={18} />} label="Workspace" value={workspace ? "Ready to unlock" : "Not created yet"} />
          </div>
        </section>

        <section className="gate-panel">
          <div className="gate-card">
            {workspace ? (
              <div className="gate-tabs segmented-control">
                <button className={mode === "unlock" ? "active" : ""} onClick={() => setMode("unlock")} type="button">Unlock</button>
                <button className={mode === "create" ? "active" : ""} onClick={() => setMode("create")} type="button">Recreate</button>
              </div>
            ) : (
              <div className="gate-card-title">Create workspace</div>
            )}

            <form className="gate-form" onSubmit={submit}>
              {mode === "create" ? (
                <Field id="workspace-name" label="Workspace Name" onChange={(e) => setWorkspaceName(e.target.value)} placeholder="Personal Workspace" required value={workspaceName} />
              ) : null}

              <label className="passphrase-field" htmlFor="passphrase">
                <span>Passphrase</span>
                <div className="passphrase-input-row">
                  <input
                    id="passphrase"
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder={mode === "create" ? "At least 10 characters" : "Workspace passphrase"}
                    required
                    type={visible ? "text" : "password"}
                    value={passphrase}
                  />
                  <button aria-label={visible ? "Hide passphrase" : "Show passphrase"} className="passphrase-toggle" onClick={() => setVisible(!visible)} type="button">
                    {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              {mode === "create" ? (
                <Field id="confirm-passphrase" label="Confirm Passphrase" onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat passphrase" required type={visible ? "text" : "password"} value={confirm} />
              ) : null}

              {error ? <p className="gate-error">{error}</p> : null}

              <Button disabled={busy} full type="submit" variant="primary">
                {busy ? (mode === "create" ? "Creating workspace..." : "Unlocking...") : mode === "create" ? "Create Encrypted Workspace" : "Unlock Workspace"}
              </Button>
            </form>

            <div className="gate-security">
              <IconTile><Shield size={16} /></IconTile>
              <div>
                <strong>Client-side encryption</strong>
                <span>Passphrase never leaves this browser. Only ciphertext is stored in SQLite.</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export function WorkspaceLoading() {
  return (
    <div className="gate-page">
      <a href="/" className="brand-button gate-brand"><span className="brand-mark"><LogoMark /></span><span>Apiki</span></a>
      <main className="gate-layout">
        <section className="gate-copy">
          <h1>Connecting Apiki to SQLite</h1>
          <p>The app is loading the live workspace before showing protected records.</p>
        </section>
        <section className="gate-panel">
          <EmptyState icon={<DatabaseZap size={28} />} title="Checking live database" body="No sample records are shown while Apiki connects." />
        </section>
      </main>
    </div>
  );
}
