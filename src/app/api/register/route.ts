import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, patientAssignments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth-helpers";
import { contract } from "@/lib/api/contract";
import { contractRoute } from "@/lib/api/contract-handler";

export const POST = contractRoute(contract.register, async ({ body }) => {
  const { email, password } = body;

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });

  if (existing) {
    // A PDA registering as a patient upgrades their type from 'patient_designated_agent' to 'patient'.
    // Their existing patientDesignatedAgents relationship records are preserved — they remain a PDA
    // to any patients they were already representing. After upgrade, they are simultaneously a patient
    // (with their own records, profile, releases) and a PDA (with access to /representing/*).
    // The middleware and UI should allow both roles to coexist. See middleware.ts for routing notes.
    if (existing.type === 'patient_designated_agent') {
      const hashed = await hashPassword(password);
      await db.update(users).set({ type: 'patient', password: hashed }).where(eq(users.id, existing.id));

      // Assign to a random admin if not already assigned
      const alreadyAssigned = await db.query.patientAssignments.findFirst({
        where: eq(patientAssignments.patientId, existing.id),
      });
      if (!alreadyAssigned) {
        const admins = await db.query.users.findMany({ where: eq(users.type, 'admin') });
        if (admins.length > 0) {
          const picked = admins[Math.floor(Math.random() * admins.length)];
          await db.insert(patientAssignments).values({
            id: crypto.randomUUID(),
            patientId: existing.id,
            assignedToId: picked.id,
          });
        }
      }

      return NextResponse.json({ id: existing.id, email: existing.email, upgraded: true }, { status: 200 });
    }

    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
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
});
