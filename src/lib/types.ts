export type KeyStatus = "active" | "inactive" | "rotating" | "revoked";
export type Environment = "Production" | "Staging" | "Development" | "Sandbox";

export type WorkspaceRecord = {
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

export type WorkspaceMeta = {
  workspaceName: string;
  ownerEmail: string;
  createdAt: string;
};

export type WorkspaceEnvelope = {
  version: 1;
  salt: string;
  verifier: {
    iv: string;
    cipherText: string;
  };
  meta: WorkspaceMeta;
  records: WorkspaceRecord[];
  monitoring: MonitoringPrefs;
};

export type MonitoringPrefs = {
  rotation: boolean;
  docs: boolean;
  inactive: boolean;
  cost: boolean;
};

export type NewKeyForm = {
  service: string;
  name: string;
  apiKey: string;
  environment: Environment;
  status: KeyStatus;
  owner: string;
  description: string;
  website: string;
  docsUrl: string;
  monthlyLimit: string;
  monthlyCost: string;
  rotationIntervalDays: string;
};

export type LiveStatus = {
  state: "loading" | "ready" | "error" | "unconfigured";
  message: string;
};

export const VERIFIER_TEXT = "apiki-verifier";

export const ENVIRONMENTS: Environment[] = ["Production", "Staging", "Development", "Sandbox"];
export const STATUSES: KeyStatus[] = ["active", "inactive", "rotating", "revoked"];

export const emptyForm: NewKeyForm = {
  service: "",
  name: "",
  apiKey: "",
  environment: "Production",
  status: "active",
  owner: "",
  description: "",
  website: "",
  docsUrl: "",
  monthlyLimit: "",
  monthlyCost: "",
  rotationIntervalDays: "90",
};
