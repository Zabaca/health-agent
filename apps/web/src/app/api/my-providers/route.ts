import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { userProviders } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";

export const GET = contractRoute(contract.myProviders.list, async ({ req }) => {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const providers = await db
    .select()
    .from(userProviders)
    .where(eq(userProviders.userId, result.userId))
    .orderBy(asc(userProviders.order));

  return NextResponse.json(providers);
});

export const PUT = contractRoute(contract.myProviders.replace, async ({ req, body }) => {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const { providers } = body;
  const userId = result.userId;

  await db.transaction(async (tx) => {
    await tx.delete(userProviders).where(eq(userProviders.userId, userId));
    if (providers.length > 0) {
      await tx.insert(userProviders).values(
        providers.map((p, i) => ({
          id: crypto.randomUUID(),
          userId,
          ...p,
          providerName: p.providerName ?? "",
          order: i,
        }))
      );
    }
  });

  revalidatePath('/my-providers');
  revalidatePath('/dashboard');
  return NextResponse.json({ success: true });
});
