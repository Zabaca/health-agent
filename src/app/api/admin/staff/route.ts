import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, zabacaAgentRoles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";

export const GET = contractRoute(contract.admin.patients.listStaff, async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.type !== 'admin' && !session.user.isAgent) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const agentRoles = await db.query.zabacaAgentRoles.findMany({ with: { user: true } });
  const agentUsers = agentRoles.map(r => r.user);
  const adminUsers = await db.query.users.findMany({ where: eq(users.type, 'admin') });
  const staff = [...adminUsers, ...agentUsers];

  return NextResponse.json(
    staff.map((u) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, type: u.type === 'admin' ? 'admin' as const : 'agent' as const }))
  );
});
