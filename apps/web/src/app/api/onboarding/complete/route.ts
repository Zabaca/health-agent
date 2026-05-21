import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireActiveSession } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";

export const PATCH = contractRoute(contract.onboarding.complete, async () => {
  const { session, error } = await requireActiveSession();
  if (error) return error;

  // An email is mandatory before onboarding can finish. OAuth users created
  // without one must supply it in the profile step first.
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { email: true },
  });
  if (!user?.email) {
    return NextResponse.json(
      { error: "An email address is required to complete onboarding." },
      { status: 400 },
    );
  }

  await db
    .update(users)
    .set({ onboarded: true })
    .where(eq(users.id, session.user.id));

  revalidatePath('/dashboard');

  return NextResponse.json({ success: true });
});
