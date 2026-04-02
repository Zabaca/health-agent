import { NextRequest, NextResponse } from "next/server";
import { requireActiveSession } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, notInArray } from "drizzle-orm";
import { decryptPii } from "@/lib/crypto";
import { getAgentUserIds } from "@/lib/db/agent-role";

export async function GET(req: NextRequest) {
  const { session, error } = await requireActiveSession();
  if (error) return error;
  if (session.user.type !== 'admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const name = searchParams.get("name")?.toLowerCase();
  const dob = searchParams.get("dob");
  const ssnLast4 = searchParams.get("ssn");

  const agentIds = await getAgentUserIds();
  const allPatients = await db.query.users.findMany({
    where: agentIds.length > 0
      ? notInArray(users.id, agentIds)
      : eq(users.type, 'user'),
  });

  const results = allPatients
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
