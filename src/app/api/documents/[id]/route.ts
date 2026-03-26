import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { incomingFiles, fileUploadLog, patientAssignments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { deleteFromR2 } from '@/lib/r2';

type Params = { params: Promise<{ id: string }> };

async function resolveAccess(userId: string, role: string, fileId: string) {
  const file = await db.query.incomingFiles.findFirst({
    where: eq(incomingFiles.id, fileId),
    with: { uploadLog: true },
  });
  if (!file) return { file: null, allowed: false };

  if (role === 'admin') return { file, allowed: true };

  if (role === 'agent') {
    if (!file.patientId) return { file, allowed: false };
    const assignment = await db.query.patientAssignments.findFirst({
      where: and(
        eq(patientAssignments.patientId, file.patientId),
        eq(patientAssignments.assignedToId, userId)
      ),
    });
    return { file, allowed: !!assignment };
  }

  if (role === 'patient') {
    return { file, allowed: file.patientId === userId };
  }

  return { file, allowed: false };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { originalName, releaseCode } = await req.json();

  const { file, allowed } = await resolveAccess(session.user.id, session.user.type, id);
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const updates: Partial<{ releaseCode: string | null }> = {};
  if (releaseCode !== undefined) updates.releaseCode = releaseCode ?? null;

  if (Object.keys(updates).length > 0) {
    await db.update(incomingFiles).set(updates).where(eq(incomingFiles.id, id));
  }

  if (originalName !== undefined && file.uploadLog) {
    await db.update(fileUploadLog)
      .set({ originalName })
      .where(eq(fileUploadLog.incomingFileId, id));
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { file, allowed } = await resolveAccess(session.user.id, session.user.type, id);
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    await deleteFromR2(file.fileURL);
  } catch {
    // best-effort R2 delete — proceed regardless
  }

  await db.delete(incomingFiles).where(eq(incomingFiles.id, id));

  return NextResponse.json({ ok: true });
}
