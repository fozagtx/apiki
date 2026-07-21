import { NextResponse } from "next/server";
import { persistWorkspace, readWorkspace, resetWorkspace, validateWorkspace } from "../../../lib/workspace-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ workspace: await readWorkspace() });
  } catch (error) {
    return apiError(error, "Could not load the live workspace.");
  }
}

export async function PUT(request: Request) {
  try {
    const workspace = validateWorkspace(await request.json());
    await persistWorkspace(workspace);
    return NextResponse.json({ workspace: await readWorkspace() });
  } catch (error) {
    return apiError(error, "Could not save the live workspace.");
  }
}

export async function DELETE() {
  try {
    await resetWorkspace();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Could not reset the live workspace.");
  }
}

function apiError(error: unknown, fallback: string) {
  return NextResponse.json(
    {
      ok: false,
      message: error instanceof Error ? error.message : fallback,
    },
    { status: 500 },
  );
}
