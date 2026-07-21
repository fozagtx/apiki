import { NextRequest, NextResponse } from "next/server";
import { proxyRequest, getServiceConfig } from "@/lib/agent/proxy";
import { checkAccessPolicy, logAudit } from "@/lib/agent/policy";

export const runtime = "nodejs";

// This route handles: /api/proxy/:service/*
// Example: /api/proxy/vercel/v9/projects

async function getCryptoKey(request: NextRequest): Promise<CryptoKey | null> {
  const passphrase = request.headers.get("x-apiki-passphrase");
  if (!passphrase) return null;

  const { prisma } = await import("@/lib/db");
  const workspace = await prisma.workspace.findUnique({ where: { id: "primary" } });
  if (!workspace) return null;

  const { deriveKey, decryptString } = await import("@/lib/crypto");
  const { VERIFIER_TEXT } = await import("@/lib/types");
  try {
    const key = await deriveKey(passphrase, workspace.salt);
    const verified = await decryptString(key, workspace.verifierIv, workspace.verifierCipherText);
    if (verified !== VERIFIER_TEXT) return null;
    return key;
  } catch {
    return null;
  }
}

async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  
  if (!path || path.length < 1) {
    return NextResponse.json({ error: "Service name required" }, { status: 400 });
  }

  const service = path[0];
  const apiPath = "/" + path.slice(1).join("/");
  const agentId = request.headers.get("x-apiki-agent") || "unknown";
  const method = request.method;

  const cryptoKey = await getCryptoKey(request);
  if (!cryptoKey) {
    return NextResponse.json({ error: "Invalid or missing passphrase" }, { status: 401 });
  }

  // Check access policy
  const policyCheck = await checkAccessPolicy(agentId, service, method, apiPath);
  
  if (!policyCheck.allowed) {
    await logAudit({
      agentId,
      service,
      action: "api_call",
      method,
      path: apiPath,
      status: "denied",
      ip: request.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json(
      { error: "Access denied", reason: policyCheck.reason },
      { status: 403 }
    );
  }

  // Proxy the request
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const body = method !== "GET" && method !== "HEAD" 
    ? await request.text() 
    : null;

  const result = await proxyRequest(service, method, apiPath, headers, body, cryptoKey);

  // Log the access
  await logAudit({
    agentId,
    service,
    action: "api_call",
    method,
    path: apiPath,
    status: "allowed",
    ip: request.headers.get("x-forwarded-for") || "unknown",
  });

  return new NextResponse(result.body, {
    status: result.status,
    headers: result.headers,
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, context);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, context);
}
