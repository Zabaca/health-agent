import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '@/lib/auth-helpers';

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { password: true },
  });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const valid = await verifyPassword(currentPassword, user.password);
  if (!valid) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
  }

  const hashed = await hashPassword(newPassword);
  await db.update(users)
    .set({ password: hashed, mustChangePassword: false })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ ok: true });
}
