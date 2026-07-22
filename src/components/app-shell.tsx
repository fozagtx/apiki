"use client";

import {
  BarChart3,
  Bell,
  Bot,
  Gauge,
  KeyRound,
  Lock,
  LogOut,
  MonitorCheck,
  Plus,
  RefreshCw,
  ScrollText,
  Settings,
  Shield,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button, IconButton } from "./ui";
import { useWorkspace } from "./workspace-provider";
import type { WorkspaceEnvelope } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/keys", label: "API Keys", icon: KeyRound },
  { href: "/rotation", label: "Rotation", icon: RefreshCw },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/monitoring", label: "Monitoring", icon: MonitorCheck },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/policies", label: "Policies", icon: Shield },
  { href: "/audit", label: "Audit", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children, currentPath }: { children: ReactNode; currentPath: string }) {
  const { workspace, lockWorkspace, setAddOpen } = useWorkspace();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img alt="" className="brand-logo" src="/apiki-logo.png" />
          <span>Apiki</span>
        </div>
        <nav className="sidebar-nav" aria-label="App navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href;
            return (
              <a key={item.href} href={item.href} className={isActive ? "active" : ""}>
                <Icon size={18} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {(workspace?.meta.workspaceName ?? "WS").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <strong>{workspace?.meta.workspaceName ?? "Workspace"}</strong>
              <small>Locked with passphrase</small>
            </div>
          </div>
          <Button icon={<LogOut size={16} />} onClick={lockWorkspace} size="sm" variant="ghost">
            Lock
          </Button>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-header">
          <div>
            <h1>{getPageTitle(currentPath)}</h1>
            <p>Encrypted workspace backed by SQLite</p>
          </div>
          <div className="header-actions">
            <IconButton label="No provider notifications are not connected yet">
              <Bell size={18} />
            </IconButton>
            <Button icon={<Plus size={18} />} onClick={() => setAddOpen(true)} variant="primary">
              Create API Key
            </Button>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

function getPageTitle(path: string) {
  const item = NAV_ITEMS.find((nav) => nav.href === path);
  return item?.label ?? "Dashboard";
}
