import { prisma } from "../db";
import { decryptString } from "../crypto";

export type ServiceConfig = {
  name: string;
  baseUrl: string;
  authHeader: string;
  authPrefix: string;
};

export const SERVICE_CONFIGS: Record<string, ServiceConfig> = {
  vercel: {
    name: "Vercel",
    baseUrl: "https://api.vercel.com",
    authHeader: "Authorization",
    authPrefix: "Bearer ",
  },
  neon: {
    name: "Neon",
    baseUrl: "https://console.neon.tech/api/v2",
    authHeader: "Authorization",
    authPrefix: "Bearer ",
  },
  openai: {
    name: "OpenAI",
    baseUrl: "https://api.openai.com",
    authHeader: "Authorization",
    authPrefix: "Bearer ",
  },
  github: {
    name: "GitHub",
    baseUrl: "https://api.github.com",
    authHeader: "Authorization",
    authPrefix: "Bearer ",
  },
  stripe: {
    name: "Stripe",
    baseUrl: "https://api.stripe.com",
    authHeader: "Authorization",
    authPrefix: "Bearer ",
  },
  anthropic: {
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com",
    authHeader: "x-api-key",
    authPrefix: "",
  },
  aws: {
    name: "AWS",
    baseUrl: "https://aws.amazon.com",
    authHeader: "Authorization",
    authPrefix: "Bearer ",
  },
  supabase: {
    name: "Supabase",
    baseUrl: "https://api.supabase.com",
    authHeader: "apikey",
    authPrefix: "",
  },
};

export async function getServiceKey(service: string): Promise<string | null> {
  const record = await prisma.apiKeyRecord.findFirst({
    where: {
      service: { equals: service, mode: "insensitive" },
      status: "active",
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!record) return null;

  // We need the workspace crypto key to decrypt
  // This will be passed from the proxy handler
  return record.cipherText;
}

export async function decryptServiceKey(
  service: string,
  cryptoKey: CryptoKey
): Promise<string | null> {
  const record = await prisma.apiKeyRecord.findFirst({
    where: {
      service: { equals: service, mode: "insensitive" },
      status: "active",
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!record) return null;

  try {
    return await decryptString(cryptoKey, record.iv, record.cipherText);
  } catch {
    return null;
  }
}

export function getServiceConfig(service: string): ServiceConfig | null {
  return SERVICE_CONFIGS[service.toLowerCase()] ?? null;
}

export async function listAvailableServices(): Promise<
  Array<{ name: string; label: string; status: string; hasKey: boolean }>
> {
  const records = await prisma.apiKeyRecord.findMany({
    where: { status: "active" },
    select: { service: true, status: true },
    distinct: ["service"],
  });

  return Object.keys(SERVICE_CONFIGS).map((key) => {
    const record = records.find(
      (r) => r.service.toLowerCase() === key.toLowerCase()
    );
    return {
      name: key,
      label: SERVICE_CONFIGS[key].name,
      status: record ? "active" : "not_configured",
      hasKey: !!record,
    };
  });
}

export async function proxyRequest(
  service: string,
  method: string,
  path: string,
  headers: Record<string, string>,
  body: string | null,
  cryptoKey: CryptoKey
): Promise<{ status: number; headers: Record<string, string>; body: string }> {
  const config = getServiceConfig(service);
  if (!config) {
    return {
      status: 404,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: `Unknown service: ${service}` }),
    };
  }

  const key = await decryptServiceKey(service, cryptoKey);
  if (!key) {
    return {
      status: 401,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        error: `No active key found for service: ${service}`,
      }),
    };
  }

  const targetUrl = `${config.baseUrl}${path}`;

  const proxyHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === "host") continue;
    if (k.toLowerCase() === "x-apiki-service") continue;
    if (k.toLowerCase() === "x-apiki-agent") continue;
    if (k.toLowerCase() === "content-length") continue;
    proxyHeaders[k] = v;
  }

  proxyHeaders[config.authHeader] = `${config.authPrefix}${key}`;

  try {
    const response = await fetch(targetUrl, {
      method,
      headers: proxyHeaders,
      body: body && method !== "GET" && method !== "HEAD" ? body : undefined,
    });

    const responseBody = await response.text();
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      if (
        key.toLowerCase() !== "content-length" &&
        key.toLowerCase() !== "transfer-encoding"
      ) {
        responseHeaders[key] = value;
      }
    });

    return {
      status: response.status,
      headers: responseHeaders,
      body: responseBody,
    };
  } catch (error) {
    return {
      status: 502,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        error: "Proxy request failed",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
}
