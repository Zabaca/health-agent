import { NextResponse } from "next/server";
import { requireActiveSession } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendAccountSuspendedEmail, sendAccountReinstatedEmail } from "@/lib/email";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireActiveSession();
  if (error) return error;
  if (session.user.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "You cannot disable your own account" }, { status: 400 });
  }

  const target = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { disabled } = await req.json() as { disabled: boolean };
  if (typeof disabled !== "boolean") {
    return NextResponse.json({ error: "disabled must be a boolean" }, { status: 400 });
  }

  await db.update(users).set({ disabled }).where(eq(users.id, id));

  const firstName = target.firstName || target.email;
  try {
    if (disabled) {
      await sendAccountSuspendedEmail({ to: target.email, firstName });
    } else {
      await sendAccountReinstatedEmail({ to: target.email, firstName });
    }
  } catch {
    // Email failure should not block the response
  }

  return NextResponse.json({ success: true, disabled });
}
