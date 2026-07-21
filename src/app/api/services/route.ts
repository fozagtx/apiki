import { NextResponse } from "next/server";
import { listAvailableServices } from "@/lib/agent/proxy";

export const runtime = "nodejs";

export async function GET() {
  const services = await listAvailableServices();
  return NextResponse.json({ services });
}
