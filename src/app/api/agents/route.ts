import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    agents: agents.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      status: a.status,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        description: description || "",
      },
    });

    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        status: agent.status,
        createdAt: agent.createdAt.toISOString(),
        updatedAt: agent.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create agent" },
      { status: 500 }
    );
  }
}
