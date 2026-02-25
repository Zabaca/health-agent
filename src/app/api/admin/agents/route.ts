import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth-helpers";
import { eq } from "drizzle-orm";

function generatePassword(length = 16): string {
  // Omit visually ambiguous characters (0, O, 1, I, l)
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => charset[v % charset.length]).join("");
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { firstName, lastName, email } = await req.json();

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
  });

  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const plainPassword = generatePassword();
  const hashedPassword = await hashPassword(plainPassword);
  const id = crypto.randomUUID();

  await db.insert(users).values({
    id,
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    type: "agent",
    mustChangePassword: true,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
  });

  return NextResponse.json(
    { id, email: email.toLowerCase().trim(), firstName: firstName.trim(), lastName: lastName.trim(), plainPassword },
    { status: 201 }
  );
}
