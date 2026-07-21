import { NextResponse } from "next/server";
import { prisma, getDatabasePath } from "../../../lib/db";
import { existsSync } from "node:fs";

export const runtime = "nodejs";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        ok: false,
        status: "unconfigured",
        message: "DATABASE_URL is not configured.",
      },
      { status: 503 },
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    const dbPath = getDatabasePath();
    return NextResponse.json({
      ok: true,
      status: "ready",
      database: "sqlite",
      path: dbPath,
      exists: existsSync(dbPath),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        message: error instanceof Error ? error.message : "SQLite database is unavailable.",
      },
      { status: 503 },
    );
  }
}
