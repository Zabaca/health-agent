import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getRelease(id: string, userId: string) {
  return prisma.release.findFirst({
    where: { id, userId },
    include: { providers: { orderBy: { order: "asc" } } },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const release = await getRelease(id, session.user.id);
  if (!release) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(release);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getRelease(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { providers, ...releaseData } = body;

    // Remove id fields that shouldn't be updated
    const { id: _id, userId: _userId, createdAt: _createdAt, updatedAt: _updatedAt, ...updateData } = releaseData;
    void _id; void _userId; void _createdAt; void _updatedAt;

    const release = await prisma.$transaction(async (tx) => {
      // Delete all existing providers
      await tx.provider.deleteMany({ where: { releaseId: id } });

      // Update release and re-insert providers
      const updated = await tx.release.update({
        where: { id },
        data: {
          ...updateData,
          providers: {
            create: (providers || []).map(
              (p: Record<string, unknown>, idx: number) => {
                const { id: _pid, releaseId: _rid, ...providerData } = p as Record<string, unknown>;
                void _pid; void _rid;
                return { ...providerData, order: idx };
              }
            ),
          },
        },
        include: { providers: { orderBy: { order: "asc" } } },
      });
      return updated;
    });

    return NextResponse.json(release);
  } catch (error) {
    console.error("Update release error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getRelease(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.release.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
