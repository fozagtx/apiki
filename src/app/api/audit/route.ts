import { NextResponse } from "next/server";
import { getAuditLog } from "@/lib/agent/policy";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId") || undefined;
  const limit = parseInt(searchParams.get("limit") || "100");

  const logs = await getAuditLog(agentId, limit);
  return NextResponse.json({ logs });
}
