import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { userProviders } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { myProviderSchema } from "@/lib/schemas/release";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const providers = await db
    .select()
    .from(userProviders)
    .where(eq(userProviders.userId, session.user.id))
    .orderBy(asc(userProviders.order));

  return NextResponse.json(providers);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = z.object({ providers: z.array(myProviderSchema) }).safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { providers } = parsed.data;
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

  return NextResponse.json({ success: true });
}
