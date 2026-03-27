import { db } from '../src/lib/db';
import { patientDesignatedAgents } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendInviteEmail } from '../src/lib/email';

const invite = await db.query.patientDesignatedAgents.findFirst({
  where: eq(patientDesignatedAgents.inviteeEmail, 'wasabi1@mailinator.com'),
  with: { patient: true },
});

if (!invite) {
  console.error('No invite found for wasabi1@mailinator.com');
  process.exit(1);
}

const patientName =
  [invite.patient?.firstName, invite.patient?.lastName].filter(Boolean).join(' ') ||
  invite.patient?.email ||
  'Patient';

const token = invite.token ?? 'test-token';
const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${token}`;

console.log('Sending test invite email...');
console.log({ to: invite.inviteeEmail, patientName, relationship: invite.relationship, inviteUrl });

process.env.EMAIL_FROM = 'onboarding@resend.dev';

await sendInviteEmail({
  to: 'james@zabaca.com',
  inviteUrl,
  patientName,
  relationship: invite.relationship,
});

console.log('Done.');
