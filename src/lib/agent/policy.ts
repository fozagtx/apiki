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

export async function checkAccessPolicy(
  agentId: string,
  service: string,
  method: string,
  path: string
): Promise<{ allowed: boolean; reason?: string }> {
  const policy = await prisma.accessPolicy.findFirst({
    where: {
      agentId,
      service,
    },
  });

  if (!policy) {
    return { allowed: false, reason: "No policy found for this agent/service" };
  }

  if (!policy.allowedMethods.includes(method) && !policy.allowedMethods.includes("*")) {
    return { allowed: false, reason: `Method ${method} not allowed` };
  }

  const pathAllowed = policy.allowedPaths.some((allowedPath) => {
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
  if (policy.timeWindow) {
    const tw = policy.timeWindow as { start: string; end: string };
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    if (currentTime < tw.start || currentTime > tw.end) {
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

  if (recentCount >= policy.maxRequestsPerHour) {
    return { allowed: false, reason: "Rate limit exceeded" };
  }

  return { allowed: true };
}

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

export async function createAccessPolicy(policy: Omit<AccessPolicy, "id" | "createdAt" | "updatedAt">) {
  const created = await prisma.accessPolicy.create({
    data: {
      agentId: policy.agentId,
      service: policy.service,
      allowedMethods: policy.allowedMethods,
      allowedPaths: policy.allowedPaths,
      maxRequestsPerHour: policy.maxRequestsPerHour,
      requireApprovalAbove: policy.requireApprovalAbove,
      timeWindow: policy.timeWindow,
    },
  });

  return {
    id: created.id,
    agentId: created.agentId,
    service: created.service,
    allowedMethods: created.allowedMethods,
    allowedPaths: created.allowedPaths,
    maxRequestsPerHour: created.maxRequestsPerHour,
    requireApprovalAbove: created.requireApprovalAbove,
    timeWindow: created.timeWindow,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function listAccessPolicies(agentId?: string) {
  const where = agentId ? { agentId } : {};
  const policies = await prisma.accessPolicy.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return policies.map((p) => ({
    id: p.id,
    agentId: p.agentId,
    service: p.service,
    allowedMethods: p.allowedMethods,
    allowedPaths: p.allowedPaths,
    maxRequestsPerHour: p.maxRequestsPerHour,
    requireApprovalAbove: p.requireApprovalAbove,
    timeWindow: p.timeWindow,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));
}

export async function deleteAccessPolicy(id: string) {
  await prisma.accessPolicy.delete({ where: { id } });
}
