import { prisma } from "./db";

type KeyStatus = "active" | "inactive" | "rotating" | "revoked";
type Environment = "Production" | "Staging" | "Development" | "Sandbox";

export type WorkspaceRecordPayload = {
  id: string;
  service: string;
  name: string;
  environment: Environment;
  status: KeyStatus;
  owner: string;
  description: string;
  website: string;
  docsUrl: string;
  monthlyLimit: number;
  monthlyCost: number;
  rotationIntervalDays: number;
  lastRotatedAt: string;
  createdAt: string;
  updatedAt: string;
  cipherText: string;
  iv: string;
};

export type WorkspacePayload = {
  version: 1;
  salt: string;
  verifier: {
    iv: string;
    cipherText: string;
  };
  meta: {
    workspaceName: string;
    ownerEmail: string;
    createdAt: string;
  };
  records: WorkspaceRecordPayload[];
  monitoring: {
    rotation: boolean;
    docs: boolean;
    inactive: boolean;
    cost: boolean;
  };
};

const workspaceId = "primary";

export async function readWorkspace(): Promise<WorkspacePayload | null> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { records: { orderBy: { createdAt: "desc" } } },
  });

  if (!workspace) return null;

  return {
    version: 1,
    salt: workspace.salt,
    verifier: {
      iv: workspace.verifierIv,
      cipherText: workspace.verifierCipherText,
    },
    meta: {
      workspaceName: workspace.workspaceName,
      ownerEmail: workspace.ownerEmail,
      createdAt: workspace.createdAt.toISOString(),
    },
    records: workspace.records.map((record) => ({
      id: record.id,
      service: record.service,
      name: record.name,
      environment: record.environment as Environment,
      status: record.status as KeyStatus,
      owner: record.owner,
      description: record.description,
      website: record.website,
      docsUrl: record.docsUrl,
      monthlyLimit: record.monthlyLimit,
      monthlyCost: record.monthlyCost,
      rotationIntervalDays: record.rotationIntervalDays,
      lastRotatedAt: record.lastRotatedAt.toISOString(),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      cipherText: record.cipherText,
      iv: record.iv,
    })),
    monitoring: {
      rotation: workspace.monitoringRotation,
      docs: workspace.monitoringDocs,
      inactive: workspace.monitoringInactive,
      cost: workspace.monitoringCost,
    },
  };
}

export async function persistWorkspace(workspace: WorkspacePayload) {
  const recordIds = workspace.records.map((record) => record.id);

  await prisma.$transaction(async (transaction) => {
    await transaction.workspace.upsert({
      where: { id: workspaceId },
      create: {
        id: workspaceId,
        version: workspace.version,
        salt: workspace.salt,
        verifierIv: workspace.verifier.iv,
        verifierCipherText: workspace.verifier.cipherText,
        workspaceName: workspace.meta.workspaceName,
        ownerEmail: workspace.meta.ownerEmail,
        monitoringRotation: workspace.monitoring.rotation,
        monitoringDocs: workspace.monitoring.docs,
        monitoringInactive: workspace.monitoring.inactive,
        monitoringCost: workspace.monitoring.cost,
        createdAt: toDate(workspace.meta.createdAt),
      },
      update: {
        version: workspace.version,
        salt: workspace.salt,
        verifierIv: workspace.verifier.iv,
        verifierCipherText: workspace.verifier.cipherText,
        workspaceName: workspace.meta.workspaceName,
        ownerEmail: workspace.meta.ownerEmail,
        monitoringRotation: workspace.monitoring.rotation,
        monitoringDocs: workspace.monitoring.docs,
        monitoringInactive: workspace.monitoring.inactive,
        monitoringCost: workspace.monitoring.cost,
      },
    });

    await transaction.apiKeyRecord.deleteMany({
      where: {
        workspaceId,
        id: { notIn: recordIds },
      },
    });

    for (const record of workspace.records) {
      await transaction.apiKeyRecord.upsert({
        where: { id: record.id },
        create: recordToPrisma(record),
        update: {
          service: record.service,
          name: record.name,
          environment: record.environment,
          status: record.status,
          owner: record.owner,
          description: record.description,
          website: record.website,
          docsUrl: record.docsUrl,
          monthlyLimit: record.monthlyLimit,
          monthlyCost: record.monthlyCost,
          rotationIntervalDays: record.rotationIntervalDays,
          lastRotatedAt: toDate(record.lastRotatedAt),
          updatedAt: toDate(record.updatedAt),
          cipherText: record.cipherText,
          iv: record.iv,
        },
      });
    }
  });
}

export async function resetWorkspace() {
  await prisma.workspace.deleteMany({ where: { id: workspaceId } });
}

export function validateWorkspace(value: WorkspacePayload): WorkspacePayload {
  if (!value || value.version !== 1 || !value.salt || !value.verifier?.iv || !value.verifier?.cipherText) {
    throw new Error("Workspace payload is invalid.");
  }

  if (!value.meta?.workspaceName || !value.meta?.createdAt) {
    throw new Error("Workspace metadata is invalid.");
  }

  value.meta.ownerEmail = value.meta.ownerEmail ?? "";

  if (!Array.isArray(value.records)) {
    throw new Error("Workspace records are invalid.");
  }

  return value;
}

function recordToPrisma(record: WorkspaceRecordPayload) {
  return {
    id: record.id,
    workspaceId,
    service: record.service,
    name: record.name,
    environment: record.environment,
    status: record.status,
    owner: record.owner,
    description: record.description,
    website: record.website,
    docsUrl: record.docsUrl,
    monthlyLimit: record.monthlyLimit,
    monthlyCost: record.monthlyCost,
    rotationIntervalDays: record.rotationIntervalDays,
    lastRotatedAt: toDate(record.lastRotatedAt),
    createdAt: toDate(record.createdAt),
    updatedAt: toDate(record.updatedAt),
    cipherText: record.cipherText,
    iv: record.iv,
  };
}

function toDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date in workspace payload.");
  }
  return date;
}
