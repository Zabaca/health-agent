import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { releases as releasesTable, providers as providersTable, users, userProviders } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { releaseSchema } from "@/lib/schemas/release";

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
    const parsed = releaseSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { providers, ...releaseData } = parsed.data;

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

      const insertedProviders = providers.length
        ? await tx
            .insert(providersTable)
            .values(
              providers.map((p, i) => ({
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

    // Silently backfill empty profile fields from submitted release data
    try {
      const userId = session.user.id;
      const existingUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
      const patch: Partial<typeof users.$inferInsert> = {};
      if (!existingUser?.firstName)   patch.firstName   = releaseData.firstName;
      if (!existingUser?.middleName)  patch.middleName  = releaseData.middleName;
      if (!existingUser?.lastName)    patch.lastName    = releaseData.lastName;
      if (!existingUser?.dateOfBirth) patch.dateOfBirth = releaseData.dateOfBirth;
      if (!existingUser?.address)     patch.address     = releaseData.mailingAddress;
      if (!existingUser?.phoneNumber) patch.phoneNumber = releaseData.phoneNumber;
      if (!existingUser?.ssn)         patch.ssn         = releaseData.ssn;
      if (Object.keys(patch).length > 0) {
        await db.update(users).set(patch).where(eq(users.id, userId));
      }
    } catch {
      // swallow — do not block the release response
    }

    // Silently backfill userProviders from submitted release providers
    try {
      const userId = session.user.id;
      await db.transaction(async (tx) => {
        await tx.delete(userProviders).where(eq(userProviders.userId, userId));
        if (providers.length > 0) {
          await tx.insert(userProviders).values(
            providers.map((p, i) => ({
              id: crypto.randomUUID(),
              userId,
              ...p,
              order: i,
            }))
          );
        }
      });
    } catch {
      // swallow — do not block the release response
    }

    return NextResponse.json(release, { status: 201 });
  } catch (error) {
    console.error("Create release error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
