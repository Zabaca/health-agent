import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { or, eq } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";

export const GET = contractRoute(contract.admin.patients.listStaff, async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.type !== 'admin' && session.user.type !== 'agent') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const staff = await db.query.users.findMany({
    where: or(eq(users.type, 'admin'), eq(users.type, 'agent')),
  });

  return NextResponse.json(
    staff.map((u) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, type: u.type as 'admin' | 'agent' }))
  );
});
