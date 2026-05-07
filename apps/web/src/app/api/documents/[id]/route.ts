import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveUserSession } from '@/lib/session-resolver';
import { db } from '@/lib/db';
import { incomingFiles, fileUploadLog, patientAssignments, patientDesignatedAgents, userProviders } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { deleteFromR2 } from '@/lib/r2';

const patchSchema = z.object({
  originalName: z.string().trim().min(1).max(500).optional(),
  userProviderId: z.string().nullable().optional(),
});

type Params = { params: Promise<{ id: string }> };

interface UserContext {
  userId: string;
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
        eq(patientAssignments.assignedToId, user.userId)
      ),
    });
    return { file, allowed: !!assignment };
  }

  if (user.isPda) {
    if (!file.patientId) return { file, allowed: false };
    // Only PDAs with editor permission may rename/delete
    const relation = await db.query.patientDesignatedAgents.findFirst({
      where: and(
        eq(patientDesignatedAgents.agentUserId, user.userId),
        eq(patientDesignatedAgents.patientId, file.patientId),
        eq(patientDesignatedAgents.status, 'accepted'),
      ),
    });
    return { file, allowed: relation?.healthRecordsPermission === 'editor' };
  }

  // Regular patient
  return { file, allowed: file.patientId === user.userId };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { originalName, userProviderId } = parsed.data;

  const { file, allowed } = await resolveAccess(result, id);
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const updates: Partial<{ userProviderId: string | null }> = {};
  if (userProviderId !== undefined) {
    if (userProviderId === null || userProviderId === '') {
      updates.userProviderId = null;
    } else if (typeof userProviderId === 'string' && file.patientId) {
      const provider = await db.query.userProviders.findFirst({
        where: and(eq(userProviders.id, userProviderId), eq(userProviders.userId, file.patientId)),
        columns: { id: true },
      });
      if (!provider) return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
      updates.userProviderId = userProviderId;
    } else {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }
  }

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

export async function DELETE(req: NextRequest, { params }: Params) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const { id } = await params;

  const { file, allowed } = await resolveAccess(result, id);
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await db.update(incomingFiles)
    .set({ deletedAt: new Date().toISOString(), deletedById: result.userId })
    .where(eq(incomingFiles.id, id));

  return NextResponse.json({ ok: true });
}
