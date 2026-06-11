import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, patientAssignments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, normalizeEmail } from "@/lib/auth-helpers";
import { contract } from "@/lib/api/contract";
import { contractRoute } from "@/lib/api/contract-handler";
import { isAdult, MINIMUM_AGE } from "@health-agent/types";
import { encryptPii } from "@/lib/crypto";
import { toIsoDate } from "@/lib/dates";

export const POST = contractRoute(contract.register, async ({ body }) => {
  const { email: rawEmail, password, dateOfBirth } = body;
  const email = normalizeEmail(rawEmail);

  // Age gate up front: never create an under-18 row (sidesteps COPPA in v1).
  if (!isAdult(dateOfBirth)) {
    return NextResponse.json(
      { error: `Veladon is currently available to adults ${MINIMUM_AGE} and over.` },
      { status: 400 },
    );
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });

  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const hashed = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({
      id: crypto.randomUUID(),
      email,
      password: hashed,
      ...encryptPii({ dateOfBirth: toIsoDate(dateOfBirth) }),
    })
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
});
