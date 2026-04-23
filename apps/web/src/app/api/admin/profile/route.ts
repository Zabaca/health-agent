import { NextResponse } from "next/server";
import { requireActiveSession } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";

export const GET = contractRoute(contract.admin.profile.get, async () => {
  const { session, error } = await requireActiveSession();
  if (error) return error;
  if (session.user.type !== 'admin') {
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

export const PUT = contractRoute(contract.admin.profile.update, async ({ body }) => {
  const { session, error } = await requireActiveSession();
  if (error) return error;
  if (session.user.type !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { avatarUrl, ...rest } = body;
  await db.update(users).set({ ...rest, avatarUrl: avatarUrl ?? null }).where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true });
});
