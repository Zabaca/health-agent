import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";
import { decrypt, encryptPii } from "@/lib/crypto";
import { z } from "zod";

export const GET = contractRoute(contract.profile.get, async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  return NextResponse.json({
    firstName:   user?.firstName   ?? "",
    middleName:  user?.middleName  ?? "",
    lastName:    user?.lastName    ?? "",
    dateOfBirth: user?.dateOfBirth ? decrypt(user.dateOfBirth) : "",
    address:     user?.address     ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    ssn:         user?.ssn         ? decrypt(user.ssn) : "",
    avatarUrl:   user?.avatarUrl   ?? null,
  });
});

// PATCH — partial update (name, phone, address, avatar — used by PDA onboarding and account page)
const partialProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  avatarUrl: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = partialProfileSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { avatarUrl, ...rest } = body.data;
  await db.update(users).set({
    ...rest,
    ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl || null } : {}),
  }).where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true });
}

export const PUT = contractRoute(contract.profile.update, async ({ body }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { avatarUrl, ...rest } = body;
  await db
    .update(users)
    .set({ ...encryptPii(rest), profileComplete: true, avatarUrl: avatarUrl || null })
    .where(eq(users.id, session.user.id));

  revalidatePath('/dashboard');

  return NextResponse.json({ success: true });
});
