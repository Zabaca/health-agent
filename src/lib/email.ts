import { Resend } from 'resend';
import { getConfiguration } from './config';

export function getSiteBaseUrl(): string {
  const { SITE_DOMAIN } = getConfiguration();
  return SITE_DOMAIN ? `https://${SITE_DOMAIN}` : 'http://localhost:3000';
}

function getClient(): Resend | null {
  const { RESEND_API_KEY } = getConfiguration();
  if (!RESEND_API_KEY) return null;
  return new Resend(RESEND_API_KEY);
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<void> {
  const { EMAIL_FROM: from } = getConfiguration();
  const client = getClient();

  if (!client || !from) {
    console.log('[EMAIL] Would send email:', { to, subject, text: text ?? html });
    return;
  }

  const { error } = await client.emails.send({ from, to, subject, html, text });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

export interface ScheduledCallEmailOptions {
  to: string;
  recipientName: string;
  schedulerName: string;
  scheduledAt: string;
}

export async function sendScheduledCallEmail({
  to,
  recipientName,
  schedulerName,
  scheduledAt,
}: ScheduledCallEmailOptions): Promise<void> {
  const date = new Date(scheduledAt);
  const formattedDate = date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const subject = `A call has been scheduled with you on ${formattedDate}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Call Scheduled</h2>
      <p>Hi ${recipientName},</p>
      <p>
        <strong>${schedulerName}</strong> has scheduled a call with you.
      </p>
      <p style="font-size: 16px;">
        <strong>Date &amp; Time:</strong> ${formattedDate}
      </p>
      <p style="color: #666; font-size: 13px;">
        If you have any questions, please reach out to your care team.
      </p>
    </div>
  `;

  const text = `
Hi ${recipientName},

${schedulerName} has scheduled a call with you.

Date & Time: ${formattedDate}

If you have any questions, please reach out to your care team.
  `.trim();

  await sendEmail({ to, subject, html, text });
}

export interface NewReleaseNotificationEmailOptions {
  to: string;
  recipientName: string;
  patientName: string;
}

export async function sendNewReleaseNotificationEmail({
  to,
  recipientName,
  patientName,
}: NewReleaseNotificationEmailOptions): Promise<void> {
  const subject = `${patientName} has created a new health release`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Release Created</h2>
      <p>Hi ${recipientName},</p>
      <p>
        <strong>${patientName}</strong> has created a new health record release
        and has listed you as their authorized representative.
      </p>
      <p style="color: #666; font-size: 13px;">
        If you have any questions, please reach out to your care team.
      </p>
    </div>
  `;

  const text = `
Hi ${recipientName},

${patientName} has created a new health record release and listed you as their authorized representative.

If you have any questions, please reach out to your care team.
  `.trim();

  await sendEmail({ to, subject, html, text });
}

export interface ReleaseSignatureRequiredEmailOptions {
  to: string;
  patientName: string;
  createdByName: string;
  releasesUrl: string;
}

export async function sendReleaseSignatureRequiredEmail({
  to,
  patientName,
  createdByName,
  releasesUrl,
}: ReleaseSignatureRequiredEmailOptions): Promise<void> {
  const subject = 'A release has been created on your behalf and requires your signature';

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Signature Required</h2>
      <p>Hi ${patientName},</p>
      <p>
        <strong>${createdByName}</strong> has created a health record release on your behalf
        that requires your signature before it can be processed.
      </p>
      <div style="margin: 32px 0;">
        <a href="${releasesUrl}"
           style="background: #228be6; color: white; padding: 12px 24px; border-radius: 6px;
                  text-decoration: none; font-weight: 600;">
          Review &amp; Sign
        </a>
      </div>
      <p style="color: #666; font-size: 13px;">
        If you did not expect this, please contact your care team.
      </p>
    </div>
  `;

  const text = `
Hi ${patientName},

${createdByName} has created a health record release on your behalf that requires your signature.

Review and sign here: ${releasesUrl}

If you did not expect this, please contact your care team.
  `.trim();

  await sendEmail({ to, subject, html, text });
}

export interface NewRecordUploadEmailOptions {
  to: string;
  patientName: string;
  uploadedByName: string;
  fileName: string;
  recordsUrl: string;
}

export async function sendNewRecordUploadEmail({
  to,
  patientName,
  uploadedByName,
  fileName,
  recordsUrl,
}: NewRecordUploadEmailOptions): Promise<void> {
  const subject = 'A new medical record has been uploaded to your account';

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Medical Record Uploaded</h2>
      <p>Hi ${patientName},</p>
      <p>
        <strong>${uploadedByName}</strong> has uploaded a new medical record to your account:
      </p>
      <p style="font-size: 16px;"><strong>${fileName}</strong></p>
      <div style="margin: 32px 0;">
        <a href="${recordsUrl}"
           style="background: #228be6; color: white; padding: 12px 24px; border-radius: 6px;
                  text-decoration: none; font-weight: 600;">
          View My Records
        </a>
      </div>
      <p style="color: #666; font-size: 13px;">
        If you have any questions, please reach out to your care team.
      </p>
    </div>
  `;

  const text = `
Hi ${patientName},

${uploadedByName} has uploaded a new medical record to your account: ${fileName}

View your records here: ${recordsUrl}

If you have any questions, please reach out to your care team.
  `.trim();

  await sendEmail({ to, subject, html, text });
}

export interface InviteEmailOptions {
  to: string;
  inviteUrl: string;
  patientName: string;
  relationship?: string | null;
}

export async function sendInviteEmail({ to, inviteUrl, patientName, relationship }: InviteEmailOptions): Promise<void> {
  const relationshipLabel = relationship ? ` (${relationship})` : '';
  const subject = `You've been invited to access ${patientName}'s health records`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You've been invited</h2>
      <p>
        <strong>${patientName}</strong> has invited you${relationshipLabel} to be their
        Patient Designated Agent on the health records platform.
      </p>
      <p>As a Patient Designated Agent, you may be granted access to view documents,
      upload files, and manage provider information on their behalf — based on the
      permissions ${patientName} has configured.</p>
      <p>This invite link expires in <strong>48 hours</strong>.</p>
      <div style="margin: 32px 0;">
        <a href="${inviteUrl}"
           style="background: #228be6; color: white; padding: 12px 24px; border-radius: 6px;
                  text-decoration: none; font-weight: 600;">
          Accept Invitation
        </a>
      </div>
      <p style="color: #666; font-size: 13px;">
        If you did not expect this invitation, you can safely ignore this email.
      </p>
    </div>
  `;

  const text = `
You've been invited by ${patientName}${relationshipLabel} to be their Patient Designated Agent.

Accept the invitation here: ${inviteUrl}

This link expires in 48 hours. If you did not expect this, ignore this email.
  `.trim();

  await sendEmail({ to, subject, html, text });
}
