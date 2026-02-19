import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { profileSchema } from "@/lib/schemas/profile";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  return NextResponse.json({
    firstName:   user?.firstName   ?? "",
    middleName:  user?.middleName  ?? "",
    lastName:    user?.lastName    ?? "",
    dateOfBirth: user?.dateOfBirth ?? "",
    address:     user?.address     ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    ssn:         user?.ssn         ?? "",
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = profileSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
  }

  await db.update(users).set(parsed.data).where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true });
}
