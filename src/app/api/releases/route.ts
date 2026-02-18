import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { releases as releasesTable, providers as providersTable } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const releases = await db
    .select({
      id: releasesTable.id,
      firstName: releasesTable.firstName,
      lastName: releasesTable.lastName,
      createdAt: releasesTable.createdAt,
      updatedAt: releasesTable.updatedAt,
    })
    .from(releasesTable)
    .where(eq(releasesTable.userId, session.user.id))
    .orderBy(desc(releasesTable.updatedAt));

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

    const release = await db.transaction(async (tx) => {
      const releaseId = crypto.randomUUID();
      const now = new Date().toISOString();
      const [newRelease] = await tx
        .insert(releasesTable)
        .values({
          id: releaseId,
          userId: session.user.id,
          ...releaseData,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const insertedProviders = providers?.length
        ? await tx
            .insert(providersTable)
            .values(
              providers.map((p: Record<string, unknown>, i: number) => ({
                id: crypto.randomUUID(),
                releaseId,
                ...p,
                order: i,
              }))
            )
            .returning()
        : [];

      return { ...newRelease, providers: insertedProviders };
    });

    return NextResponse.json(release, { status: 201 });
  } catch (error) {
    console.error("Create release error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
