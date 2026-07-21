import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export const runtime = "nodejs";

export async function GET() {
  if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
    return NextResponse.json(
      {
        ok: false,
        status: "unconfigured",
        message: "Neon database URLs are not configured.",
      },
      { status: 503 },
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, status: "ready", database: "neon" });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        message: error instanceof Error ? error.message : "Neon database is unavailable.",
      },
      { status: 503 },
    );
  }
}
