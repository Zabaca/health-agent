import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { incomingFiles, fileUploadLog, patientAssignments, patientDesignatedAgents } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { deleteFromR2 } from '@/lib/r2';

type Params = { params: Promise<{ id: string }> };

interface UserContext {
  id: string;
  type: 'admin' | 'user';
  isAgent: boolean;
  isPda: boolean;
}

async function resolveAccess(user: UserContext, fileId: string) {
  const file = await db.query.incomingFiles.findFirst({
    where: and(eq(incomingFiles.id, fileId), isNull(incomingFiles.deletedAt)),
    with: { uploadLog: true },
  });
  if (!file) return { file: null, allowed: false };

  if (user.type === 'admin') return { file, allowed: true };

  if (user.isAgent) {
    if (!file.patientId) return { file, allowed: false };
    const assignment = await db.query.patientAssignments.findFirst({
      where: and(
        eq(patientAssignments.patientId, file.patientId),
        eq(patientAssignments.assignedToId, user.id)
      ),
    });
    return { file, allowed: !!assignment };
  }

  if (user.isPda) {
    if (!file.patientId) return { file, allowed: false };
    // Only PDAs with editor permission may rename/delete
    const relation = await db.query.patientDesignatedAgents.findFirst({
      where: and(
        eq(patientDesignatedAgents.agentUserId, user.id),
        eq(patientDesignatedAgents.patientId, file.patientId),
        eq(patientDesignatedAgents.status, 'accepted'),
      ),
    });
    return { file, allowed: relation?.healthRecordsPermission === 'editor' };
  }

  // Regular patient
  return { file, allowed: file.patientId === user.id };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { originalName, releaseCode } = await req.json();

  const { file, allowed } = await resolveAccess(session.user, id);
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

  const { file, allowed } = await resolveAccess(session.user, id);
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await db.update(incomingFiles)
    .set({ deletedAt: new Date().toISOString(), deletedById: session.user.id })
    .where(eq(incomingFiles.id, id));

  return NextResponse.json({ ok: true });
}
