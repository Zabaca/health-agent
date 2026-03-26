import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, patientAssignments } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { decryptPii } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.isAgent) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const name = searchParams.get("name")?.toLowerCase();
  const dob = searchParams.get("dob");
  const ssnLast4 = searchParams.get("ssn");

  // Get patient IDs assigned to this agent
  const assignments = await db.query.patientAssignments.findMany({
    where: eq(patientAssignments.assignedToId, session.user.id),
  });
  const patientIds = assignments.map(a => a.patientId);

  if (patientIds.length === 0) return NextResponse.json([]);

  const patients = await db.query.users.findMany({
    where: inArray(users.id, patientIds),
  });

  const results = patients
    .map(p => decryptPii(p))
    .filter(p => {
      if (name) {
        const fullName = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ').toLowerCase();
        if (!fullName.includes(name)) return false;
      }
      if (dob && p.dateOfBirth !== dob) return false;
      if (ssnLast4 && p.ssn) {
        const cleaned = p.ssn.replace(/\D/g, '');
        if (!cleaned.endsWith(ssnLast4)) return false;
      } else if (ssnLast4 && !p.ssn) {
        return false;
      }
      return true;
    })
    .map(p => ({
      id: p.id,
      firstName: p.firstName,
      middleName: p.middleName,
      lastName: p.lastName,
      dateOfBirth: p.dateOfBirth,
      ssn_last4: p.ssn ? p.ssn.replace(/\D/g, '').slice(-4) : null,
    }));

  return NextResponse.json(results);
}
