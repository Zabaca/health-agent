import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";

export const GET = contractRoute(contract.agent.profile.get, async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.type !== 'agent') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  return NextResponse.json({
    firstName:   user?.firstName   ?? "",
    middleName:  user?.middleName  ?? "",
    lastName:    user?.lastName    ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    address:     user?.address     ?? "",
    avatarUrl:   user?.avatarUrl   ?? null,
  });
});

export const PUT = contractRoute(contract.agent.profile.update, async ({ body }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.type !== 'agent') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { avatarUrl, ...rest } = body;
  await db.update(users).set({ ...rest, avatarUrl: avatarUrl ?? null }).where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true });
});
