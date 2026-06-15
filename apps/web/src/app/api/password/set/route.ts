import { NextRequest, NextResponse } from 'next/server';
import { resolveUserSession } from '@/lib/session-resolver';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth-helpers';

// POST /api/password/set — set an INITIAL password for an authenticated user who
// signed up via Apple/Google and has none. This is safe because the caller is
// already authenticated (bearer session), which proves account control just as a
// reset email would. Distinct from /api/password/change (which verifies a current
// password): this refuses when a password already exists, so it can't be used to
// bypass that check. Requires an email on file — email+password login needs one.
export async function POST(req: NextRequest) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const { newPassword } = await req.json();
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, result.userId),
    columns: { password: true, email: true },
  });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (user.password) {
    return NextResponse.json(
      { error: 'You already have a password. Use Change Password instead.' },
      { status: 400 },
    );
  }
  if (!user.email) {
    return NextResponse.json(
      { error: 'Add an email to your account before setting a password.' },
      { status: 400 },
    );
  }

  const hashed = await hashPassword(newPassword);
  await db.update(users)
    .set({ password: hashed, mustChangePassword: false })
    .where(eq(users.id, result.userId));

  return NextResponse.json({ ok: true });
}
