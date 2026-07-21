import { NextResponse } from "next/server";
import { createAccessPolicy, listAccessPolicies, deleteAccessPolicy } from "@/lib/agent/policy";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId") || undefined;

  const policies = await listAccessPolicies(agentId);
  return NextResponse.json({ policies });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agentId, service, allowedMethods, allowedPaths, maxRequestsPerHour, requireApprovalAbove, timeWindow } = body;

    if (!agentId || !service) {
      return NextResponse.json({ error: "agentId and service are required" }, { status: 400 });
    }

    const policy = await createAccessPolicy({
      agentId,
      service,
      allowedMethods: allowedMethods || ["*"],
      allowedPaths: allowedPaths || ["*"],
      maxRequestsPerHour: maxRequestsPerHour || 60,
      requireApprovalAbove: requireApprovalAbove || 0,
      timeWindow,
    });

    return NextResponse.json({ policy });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create policy" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Policy ID required" }, { status: 400 });
    }

    await deleteAccessPolicy(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete policy" },
      { status: 500 }
    );
  }
}
