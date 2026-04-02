import { NextResponse } from "next/server";
import { requireActiveSession } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth-helpers";
import { isZabacaAgent } from "@/lib/db/agent-role";

function generatePassword(length = 16): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => charset[v % charset.length]).join("");
}

export async function PUT(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireActiveSession();
  if (error) return error;
  if (session.user.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const agent = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!agent || (agent.type !== "admin" && !(await isZabacaAgent(id)))) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const plainPassword = generatePassword();
  const hashedPassword = await hashPassword(plainPassword);

  await db
    .update(users)
    .set({ password: hashedPassword, mustChangePassword: true })
    .where(eq(users.id, id));

  return NextResponse.json({ plainPassword });
}
