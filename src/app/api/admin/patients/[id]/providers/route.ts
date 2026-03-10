import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { userProviders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";

export const GET = contractRoute(contract.admin.patientProviders.list, async ({ params }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.type !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const providers = await db.query.userProviders.findMany({
    where: eq(userProviders.userId, params.id),
  });

  return NextResponse.json(providers);
});

export const PUT = contractRoute(contract.admin.patientProviders.replace, async ({ params, body }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.type !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { providers } = body;
  const userId = params.id;

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

  return NextResponse.json({ success: true });
});
