"use client";

import {
  ArrowRight,
  BarChart3,
  Bot,
  CloudOff,
  DatabaseZap,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  Shield,
  UnlockKeyhole,
} from "lucide-react";
import { ActionCard, BrandButton, IconTile, StatusLine } from "./ui";
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
              Encrypted API key workspace + secret broker for AI agents
            </div>
            <h1>API keys, encrypted and agent-ready</h1>
            <p>
              Store keys in Neon with client-side encryption. Let AI agents call APIs without ever seeing credentials.
            </p>
            <div className="hero-chips" aria-label="Apiki assurances">
              <span>AES-GCM encryption</span>
              <span>MCP server for agents</span>
              <span>Policy-controlled proxy</span>
            </div>
            <div className="hero-actions">
              <a href="/login" className="button button-primary button-lg">Start Secure Workspace <ArrowRight size={18} /></a>
              <a href="/login" className="button button-secondary button-lg">View Demo</a>
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
                <StatusLine icon={<Bot size={18} />} label="Agent access" value="MCP + Proxy ready" />
              </div>
              <div className="status-footnote">
                Data panels stay empty until you create records in your encrypted workspace.
              </div>
            </div>
          </div>
        </section>

        <section className="feature-band" aria-label="Apiki capabilities">
          <div className="section-heading">
            <span>Two modes, one workspace</span>
            <h2>Manage keys yourself or let agents use them securely.</h2>
          </div>
          <div className="feature-grid">
            <ActionCard icon={<LockKeyhole size={20} />} title="Encrypt" body="Passphrase-derived AES-GCM encryption. Keys encrypted in your browser before reaching Neon." />
            <ActionCard icon={<Bot size={20} />} title="Agent Proxy" body="AI agents call APIs through the proxy. Keys decrypted server-side, never exposed to agents." />
            <ActionCard icon={<Shield size={20} />} title="Policy Control" body="Per-agent rules for services, methods, paths, and rate limits. Every access logged." />
          </div>
        </section>

        <section className="workflow-band">
          <div className="workflow-copy">
            <span>How it works</span>
            <h2>Agents get API access without holding credentials.</h2>
          </div>
          <div className="workflow-list">
            {[
              ["Create workspace", "Set passphrase, add API keys"],
              ["Connect agent", "MCP server or HTTP proxy"],
              ["Agent calls API", "Proxy decrypts, injects, forwards"],
              ["Audit logged", "Every access tracked with agent ID"],
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
