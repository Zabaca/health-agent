import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { incomingFiles, fileUploadLog, patientDesignatedAgents, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { sendNewRecordUploadEmail, getSiteBaseUrl } from '@/lib/email';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { fileURL, fileType, originalName, patientId, releaseCode } = await req.json();

  if (!fileURL || !fileType || !originalName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  let assignedPatientId: string | null;

  if (session.user.type === 'admin' || session.user.isAgent) {
    assignedPatientId = patientId ?? null;
  } else if (!patientId || patientId === session.user.id) {
    assignedPatientId = session.user.id;
  } else if (session.user.isPda) {
    // Verify PDA has editor permission for this patient
    const relation = await db.query.patientDesignatedAgents.findFirst({
      where: and(
        eq(patientDesignatedAgents.agentUserId, session.user.id),
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
    uploadedById: session.user.id,
    originalName,
  });

  // Notify patient when an agent, admin, or PDA uploads a record on their behalf
  try {
    const isUploadForPatient = (session.user.isAgent || session.user.type === 'admin' || session.user.isPda) &&
      assignedPatientId && assignedPatientId !== session.user.id;
    if (isUploadForPatient) {
      const patient = await db.query.users.findFirst({
        where: eq(users.id, assignedPatientId!),
        columns: { email: true, firstName: true, lastName: true },
      });
      const uploader = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
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
