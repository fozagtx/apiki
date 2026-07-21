import { prisma } from "../db";

export type AccessPolicy = {
  id: string;
  agentId: string;
  service: string;
  allowedMethods: string[];
  allowedPaths: string[];
  maxRequestsPerHour: number;
  requireApprovalAbove: number;
  timeWindow?: {
    start: string;
    end: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type AuditEntry = {
  id: string;
  timestamp: string;
  agentId: string;
  service: string;
  action: "api_call" | "command_exec" | "env_inject" | "token_create";
  method?: string;
  path?: string;
  status: "allowed" | "denied" | "approved";
  costEstimate?: number;
  ip?: string;
};

// ── SQLite serialisation helpers ────────────────────────────────────
// SQLite has no native String[] or Json column types, so we store them
// as JSON-encoded TEXT and parse/stringify at the boundary.

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJsonWindow(value: string | null): { start: string; end: string } | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function rowToPolicy(p: {
  id: string;
  agentId: string;
  service: string;
  allowedMethods: string;
  allowedPaths: string;
  maxRequestsPerHour: number;
  requireApprovalAbove: number;
  timeWindow: string | null;
  createdAt: Date;
  updatedAt: Date;
}): AccessPolicy {
  return {
    id: p.id,
    agentId: p.agentId,
    service: p.service,
    allowedMethods: parseJsonArray(p.allowedMethods),
    allowedPaths: parseJsonArray(p.allowedPaths),
    maxRequestsPerHour: p.maxRequestsPerHour,
    requireApprovalAbove: p.requireApprovalAbove,
    timeWindow: parseJsonWindow(p.timeWindow),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

// ── Policy checks ───────────────────────────────────────────────────

export async function checkAccessPolicy(
  agentId: string,
  service: string,
  method: string,
  path: string
): Promise<{ allowed: boolean; reason?: string }> {
  const raw = await prisma.accessPolicy.findFirst({
    where: { agentId, service },
  });

  if (!raw) {
    return { allowed: false, reason: "No policy found for this agent/service" };
  }

  const allowedMethods = parseJsonArray(raw.allowedMethods);
  const allowedPaths = parseJsonArray(raw.allowedPaths);

  if (!allowedMethods.includes(method) && !allowedMethods.includes("*")) {
    return { allowed: false, reason: `Method ${method} not allowed` };
  }

  const pathAllowed = allowedPaths.some((allowedPath) => {
    if (allowedPath === "*") return true;
    if (allowedPath.endsWith("/*")) {
      const prefix = allowedPath.slice(0, -2);
      return path.startsWith(prefix);
    }
    return path === allowedPath;
  });

  if (!pathAllowed) {
    return { allowed: false, reason: `Path ${path} not allowed` };
  }

  // Check time window
  const timeWindow = parseJsonWindow(raw.timeWindow);
  if (timeWindow) {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    if (currentTime < timeWindow.start || currentTime > timeWindow.end) {
      return { allowed: false, reason: "Outside allowed time window" };
    }
  }

  // Check rate limit
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.auditLog.count({
    where: {
      agentId,
      service,
      action: "api_call",
      timestamp: { gte: oneHourAgo },
    },
  });

  if (recentCount >= raw.maxRequestsPerHour) {
    return { allowed: false, reason: "Rate limit exceeded" };
  }

  return { allowed: true };
}

// ── Audit log ───────────────────────────────────────────────────────

export async function logAudit(entry: Omit<AuditEntry, "id" | "timestamp">) {
  await prisma.auditLog.create({
    data: {
      agentId: entry.agentId,
      service: entry.service,
      action: entry.action,
      method: entry.method,
      path: entry.path,
      status: entry.status,
      costEstimate: entry.costEstimate,
      ip: entry.ip,
    },
  });
}

export async function getAuditLog(agentId?: string, limit = 100) {
  const where = agentId ? { agentId } : {};
  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  return logs.map((log) => ({
    id: log.id,
    timestamp: log.timestamp.toISOString(),
    agentId: log.agentId,
    service: log.service,
    action: log.action,
    method: log.method,
    path: log.path,
    status: log.status,
    costEstimate: log.costEstimate,
    ip: log.ip,
  }));
}

// ── CRUD ────────────────────────────────────────────────────────────

export async function createAccessPolicy(policy: Omit<AccessPolicy, "id" | "createdAt" | "updatedAt">) {
  const created = await prisma.accessPolicy.create({
    data: {
      agentId: policy.agentId,
      service: policy.service,
      allowedMethods: JSON.stringify(policy.allowedMethods),
      allowedPaths: JSON.stringify(policy.allowedPaths),
      maxRequestsPerHour: policy.maxRequestsPerHour,
      requireApprovalAbove: policy.requireApprovalAbove,
      timeWindow: policy.timeWindow ? JSON.stringify(policy.timeWindow) : null,
    },
  });

  return rowToPolicy(created);
}

export async function listAccessPolicies(agentId?: string) {
  const where = agentId ? { agentId } : {};
  const policies = await prisma.accessPolicy.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return policies.map(rowToPolicy);
}

export async function deleteAccessPolicy(id: string) {
  await prisma.accessPolicy.delete({ where: { id } });
}
