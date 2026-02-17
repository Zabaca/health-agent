import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const releases = await prisma.release.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(releases);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { providers, ...releaseData } = body;

    const release = await prisma.$transaction(async (tx) => {
      const created = await tx.release.create({
        data: {
          ...releaseData,
          userId: session.user.id,
          providers: {
            create: (providers || []).map(
              (p: Record<string, unknown>, idx: number) => ({
                ...p,
                order: idx,
              })
            ),
          },
        },
        include: { providers: true },
      });
      return created;
    });

    return NextResponse.json(release, { status: 201 });
  } catch (error) {
    console.error("Create release error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
