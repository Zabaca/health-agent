import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, patientAssignments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth-helpers";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashed = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({ id: crypto.randomUUID(), email, password: hashed })
      .returning();

    const admins = await db.query.users.findMany({ where: eq(users.type, 'admin') });
    if (admins.length > 0) {
      const picked = admins[Math.floor(Math.random() * admins.length)];
      await db.insert(patientAssignments).values({
        id: crypto.randomUUID(),
        patientId: user.id,
        assignedToId: picked.id,
      });
    }

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
