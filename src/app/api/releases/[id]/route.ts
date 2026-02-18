import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { releases as releasesTable, providers as providersTable } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";

async function getRelease(id: string, userId: string) {
  return db.query.releases.findFirst({
    where: and(eq(releasesTable.id, id), eq(releasesTable.userId, userId)),
    with: { providers: { orderBy: [asc(providersTable.order)] } },
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

    const release = await db.transaction(async (tx) => {
      // Delete all existing providers
      await tx.delete(providersTable).where(eq(providersTable.releaseId, id));

      // Update release
      const [updated] = await tx
        .update(releasesTable)
        .set({ ...updateData, updatedAt: new Date().toISOString() })
        .where(eq(releasesTable.id, id))
        .returning();

      // Re-insert providers
      const insertedProviders = providers?.length
        ? await tx
            .insert(providersTable)
            .values(
              providers.map((p: Record<string, unknown>, i: number) => {
                const { id: _pid, releaseId: _rid, ...providerData } = p;
                void _pid; void _rid;
                return { id: crypto.randomUUID(), releaseId: id, ...providerData, order: i };
              })
            )
            .returning()
        : [];

      return { ...updated, providers: insertedProviders };
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

  await db.delete(releasesTable).where(eq(releasesTable.id, id));

  return NextResponse.json({ success: true });
}
