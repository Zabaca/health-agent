import { NextResponse } from 'next/server';
import { resolveUserSession } from '@/lib/session-resolver';
import { db } from '@/lib/db';
import { incomingFiles, fileUploadLog, patientDesignatedAgents, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { sendNewRecordUploadEmail, getSiteBaseUrl } from '@/lib/email';

export async function POST(req: Request) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const { fileURL, fileType, originalName, patientId, releaseCode } = await req.json();

  if (!fileURL || !fileType || !originalName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  let assignedPatientId: string | null;

  if (result.type === 'admin' || result.isAgent) {
    assignedPatientId = patientId ?? null;
  } else if (!patientId || patientId === result.userId) {
    assignedPatientId = result.userId;
  } else if (result.isPda) {
    // Verify PDA has editor permission for this patient
    const relation = await db.query.patientDesignatedAgents.findFirst({
      where: and(
        eq(patientDesignatedAgents.agentUserId, result.userId),
        eq(patientDesignatedAgents.patientId, patientId),
        eq(patientDesignatedAgents.status, 'accepted'),
      ),
    });
    if (relation?.healthRecordsPermission !== 'editor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    assignedPatientId = patientId;
  } else {
    return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
  }

  const id = nanoid();
  await db.insert(incomingFiles).values({
    id,
    fileURL,
    fileType,
    source: 'upload',
    incomingFaxLogId: null,
    patientId: assignedPatientId,
    releaseCode: releaseCode ?? null,
  });

  await db.insert(fileUploadLog).values({
    id: nanoid(),
    incomingFileId: id,
    uploadedById: result.userId,
    originalName,
  });

  // Notify patient when an agent, admin, or PDA uploads a record on their behalf
  try {
    const isUploadForPatient = (result.isAgent || result.type === 'admin' || result.isPda) &&
      assignedPatientId && assignedPatientId !== result.userId;
    if (isUploadForPatient) {
      const patient = await db.query.users.findFirst({
        where: eq(users.id, assignedPatientId!),
        columns: { email: true, firstName: true, lastName: true },
      });
      const uploader = await db.query.users.findFirst({
        where: eq(users.id, result.userId),
        columns: { firstName: true, lastName: true, email: true },
      });
      if (patient) {
        const patientName = [patient.firstName, patient.lastName].filter(Boolean).join(' ') || patient.email;
        const uploaderName = [uploader?.firstName, uploader?.lastName].filter(Boolean).join(' ') || 'Your care team';
        await sendNewRecordUploadEmail({
          to: patient.email,
          patientName,
          uploadedByName: uploaderName,
          recordsUrl: `${getSiteBaseUrl()}/my-records`,
          contact: { name: uploaderName, email: uploader?.email },
        });
      }
    }
  } catch {
    // swallow — do not block the response
  }

  return NextResponse.json({ id });
}
