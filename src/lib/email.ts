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
