"use client";

import {
  ArrowRight,
  BarChart3,
  CloudOff,
  DatabaseZap,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  Shield,
  UnlockKeyhole,
} from "lucide-react";
import { ActionCard, BrandButton, Button, EmptyState, IconTile, StatusLine } from "./ui";
import type { WorkspaceEnvelope } from "@/lib/types";

function LogoMark() {
  return <img alt="" className="brand-logo" src="/apiki-logo.png" />;
}

export function LandingPage({
  workspace,
  unlocked,
}: {
  workspace: WorkspaceEnvelope | null;
  unlocked: boolean;
}) {
  return (
    <div className="public-page">
      <header className="public-nav">
        <BrandButton icon={<LogoMark />}>
          Apiki
        </BrandButton>
        <nav aria-label="Public navigation">
          <a href="/login" className="button small-button nav-link">Workspace</a>
          <a href={unlocked ? "/dashboard" : "/login"} className="button small-button nav-link">Dashboard</a>
          <a href="/login" className="button button-primary">{unlocked ? "Open App" : "Get Started"} <ArrowRight size={16} /></a>
        </nav>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow">
              <Shield size={16} />
              Live encrypted API key management
            </div>
            <h1>Apiki keeps API keys encrypted, rotated, and accountable</h1>
            <p>
              Store encrypted key records in Neon, track rotation health, and keep
              developer credentials from turning into invisible risk.
            </p>
            <div className="hero-chips" aria-label="Apiki assurances">
              <span>Neon-backed workspace</span>
              <span>User-created records only</span>
              <span>No fake provider claims</span>
            </div>
            <div className="hero-actions">
              <a href="/login" className="button button-primary button-lg">Start Secure Workspace <ArrowRight size={18} /></a>
              <a href="/login" className="button button-secondary button-lg">Open Workspace Gate</a>
            </div>
          </div>

          <div className="hero-status gate-card" aria-label="Live workspace status">
            <div className="status-window">
              <div className="status-window-header">
                <IconTile>
                  <LockKeyhole size={18} />
                </IconTile>
                <div>
                  <strong>Live Workspace Status</strong>
                  <small>State from Neon and this browser session</small>
                </div>
              </div>
              <div className="status-list">
                <StatusLine icon={<DatabaseZap size={18} />} label="Workspace storage" value={workspace ? "Created" : "Not created"} />
                <StatusLine icon={<UnlockKeyhole size={18} />} label="Unlock state" value={unlocked ? "Unlocked" : "Locked"} />
                <StatusLine icon={<KeyRound size={18} />} label="Encrypted records" value={workspace && unlocked ? String(workspace.records.length) : workspace ? "Locked" : "0"} />
                <StatusLine icon={<CloudOff size={18} />} label="Provider alerts" value="Not connected" />
              </div>
              <div className="status-footnote">
                Data panels stay empty until you create records in your encrypted workspace.
              </div>
            </div>
          </div>
        </section>

        <section className="feature-band" aria-label="Apiki capabilities">
          <div className="section-heading">
            <span>Workspace workflow</span>
            <h2>Three focused moves for keeping credentials under control.</h2>
          </div>
          <div className="feature-grid">
            <ActionCard icon={<LockKeyhole size={20} />} title="Encrypt" body="Create a passphrase-derived workspace and store encrypted API key records in Neon." />
            <ActionCard icon={<RefreshCw size={20} />} title="Rotate" body="Set intervals, review due records, and update rotation metadata when a key changes." />
            <ActionCard icon={<BarChart3 size={20} />} title="Review" body="See health, ownership, cost, status, and documentation gaps from records you create." />
          </div>
        </section>

        <section className="workflow-band">
          <div className="workflow-copy">
            <span>Secure by default</span>
            <h2>Built for the tiny operational details that get ignored during shipping.</h2>
            <p>
              Apiki keeps the boring but crucial metadata close to the secret: owner,
              environment, docs, cost, rotation interval, and status.
            </p>
          </div>
          <div className="workflow-list">
            {[
              ["Create encrypted workspace", "Set a passphrase and workspace identity."],
              ["Add service keys", "Capture docs, ownership, limits, and rotation policy."],
              ["Review health", "Track overdue rotations and workspace monitoring checks."],
            ].map(([title, body], index) => (
              <div className="workflow-item" key={title}>
                <span>{index + 1}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
