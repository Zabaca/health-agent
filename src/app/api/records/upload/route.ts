import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { incomingFiles, fileUploadLog, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { sendNewRecordUploadEmail, getSiteBaseUrl } from '@/lib/email';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { fileURL, fileType, originalName, patientId, releaseCode } = await req.json();

  if (!fileURL || !fileType || !originalName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  let assignedPatientId: string | null = null;

  if (session.user.type === 'admin' || session.user.isAgent) {
    assignedPatientId = patientId ?? null;
  } else {
    // Regular users (patients/PDAs) always upload to themselves
    assignedPatientId = session.user.id;
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

  // Notify patient when an agent or admin uploads a record on their behalf
  try {
    const isUploadForPatient = (session.user.isAgent || session.user.type === 'admin') &&
      assignedPatientId && assignedPatientId !== session.user.id;
    if (isUploadForPatient) {
      const patient = await db.query.users.findFirst({
        where: eq(users.id, assignedPatientId!),
        columns: { email: true, firstName: true, lastName: true },
      });
      const uploader = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { firstName: true, lastName: true },
      });
      if (patient) {
        const patientName = [patient.firstName, patient.lastName].filter(Boolean).join(' ') || patient.email;
        const uploaderName = [uploader?.firstName, uploader?.lastName].filter(Boolean).join(' ') || 'Your care team';
        await sendNewRecordUploadEmail({
          to: patient.email,
          patientName,
          uploadedByName: uploaderName,
          fileName: originalName,
          recordsUrl: `${getSiteBaseUrl()}/my-records`,
        });
      }
    }
  } catch {
    // swallow — do not block the response
  }

  return NextResponse.json({ id });
}
