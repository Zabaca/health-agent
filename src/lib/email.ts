/**
 * Email service — implemented via Resend.
 * Required env vars:
 *   RESEND_API_KEY — Resend API key
 *   EMAIL_FROM     — sender address (e.g. "noreply@yourdomain.com")
 */

import { Resend } from 'resend';

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<void> {
  const from = process.env.EMAIL_FROM;
  const client = getClient();

  if (!client || !from) {
    console.log('[EMAIL] Would send email:', { to, subject, text: text ?? html });
    return;
  }

  const { error } = await client.emails.send({ from, to, subject, html, text });
  if (error) throw new Error(`Resend error: ${error.message}`);
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
