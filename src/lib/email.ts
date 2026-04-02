import { Resend } from 'resend';
import { getConfiguration } from './config';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

/** Wraps content in a full-width email shell with consistent typography. */
function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
        <tr><td style="padding:40px 48px;font-size:16px;line-height:1.6;color:#1a1a2e;">
          ${content}
        </td></tr>
        <tr><td style="padding:24px 48px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280;line-height:1.5;">
          This is an automated message. Please do not reply directly to this email.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Contact footer helpers ────────────────────────────────────────────────────

/**
 * contact = undefined  → "please reach out to your care team."
 * contact = null       → line is omitted entirely
 * contact = { name }   → "please reach out to [name]." (patient-originated)
 * contact = { name, email } → "please reach out to [name] at [email]." (agent/PDA-originated)
 */
export interface ContactInfo {
  name: string;
  email?: string;
}

function contactFooterHtml(contact?: ContactInfo | null): string {
  if (contact === null) return '';
  if (contact === undefined) {
    return '<p style="margin:24px 0 0;color:#6b7280;font-size:14px;">If you have any questions, please reach out to your care team.</p>';
  }
  const ref = contact.email
    ? `<a href="mailto:${contact.email}" style="color:#228be6;text-decoration:none;">${contact.name}</a>`
    : `<strong>${contact.name}</strong>`;
  return `<p style="margin:24px 0 0;color:#6b7280;font-size:14px;">If you have any questions, please reach out to ${ref}.</p>`;
}

function contactFooterText(contact?: ContactInfo | null): string {
  if (contact === null) return '';
  if (contact === undefined) return '\n\nIf you have any questions, please reach out to your care team.';
  const ref = contact.email ? `${contact.name} at ${contact.email}` : contact.name;
  return `\n\nIf you have any questions, please reach out to ${ref}.`;
}

// ── Calendar helpers ──────────────────────────────────────────────────────────

function toIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function buildCalendarUrls(callId: string, scheduledAt: string, baseUrl: string) {
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const title = encodeURIComponent('Scheduled Call');
  const desc = encodeURIComponent('A health call has been scheduled.');
  return {
    google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${toIcsDate(start)}/${toIcsDate(end)}&details=${desc}`,
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${encodeURIComponent(start.toISOString())}&enddt=${encodeURIComponent(end.toISOString())}&body=${desc}`,
    yahoo: `https://calendar.yahoo.com/?v=60&title=${title}&st=${toIcsDate(start)}&et=${toIcsDate(end)}&desc=${desc}`,
    ics: `${baseUrl}/api/scheduled-calls/${callId}/ics`,
  };
}

const calBtnStyle = 'display:inline-block;margin:4px 6px 4px 0;padding:10px 18px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;';

// ── Email functions ───────────────────────────────────────────────────────────

export interface ScheduledCallEmailOptions {
  to: string;
  recipientName: string;
  schedulerName: string;
  scheduledAt: string;
  callId?: string;
  contact?: ContactInfo | null;
}

export async function sendScheduledCallEmail({
  to,
  recipientName,
  schedulerName,
  scheduledAt,
  callId,
  contact,
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
  const baseUrl = getSiteBaseUrl();

  let calendarSection = '';
  let calendarText = '';
  if (callId) {
    const urls = buildCalendarUrls(callId, scheduledAt, baseUrl);
    calendarSection = `
      <div style="margin:32px 0 8px;">
        <p style="margin:0 0 12px;font-weight:600;color:#374151;">Add to Calendar</p>
        <a href="${urls.google}"  style="${calBtnStyle}background:#4285F4;color:#fff;">Google</a>
        <a href="${urls.outlook}" style="${calBtnStyle}background:#0078D4;color:#fff;">Outlook</a>
        <a href="${urls.yahoo}"   style="${calBtnStyle}background:#6001D2;color:#fff;">Yahoo</a>
        <a href="${urls.ics}"     style="${calBtnStyle}background:#1c1c1e;color:#fff;">Apple / ICS</a>
      </div>`;
    calendarText = `\n\nAdd to Calendar:\n  Google:  ${urls.google}\n  Outlook: ${urls.outlook}\n  Yahoo:   ${urls.yahoo}\n  ICS:     ${urls.ics}`;
  }

  const html = emailShell(`
    <h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111827;">Call Scheduled</h2>
    <p style="margin:0 0 16px;">Hi ${recipientName},</p>
    <p style="margin:0 0 16px;"><strong>${schedulerName}</strong> has scheduled a call with you.</p>
    <p style="margin:0 0 16px;font-size:18px;"><strong>Date &amp; Time:</strong> ${formattedDate}</p>
    ${calendarSection}
    ${contactFooterHtml(contact)}
  `);

  const text = `Hi ${recipientName},\n\n${schedulerName} has scheduled a call with you.\n\nDate & Time: ${formattedDate}${calendarText}${contactFooterText(contact)}`;

  await sendEmail({ to, subject, html, text });
}

export interface NewReleaseNotificationEmailOptions {
  to: string;
  recipientName: string;
  patientName: string;
  contact?: ContactInfo | null;
}

export async function sendNewReleaseNotificationEmail({
  to,
  recipientName,
  patientName,
  contact,
}: NewReleaseNotificationEmailOptions): Promise<void> {
  const subject = `${patientName} has created a new health release`;

  const html = emailShell(`
    <h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111827;">New Release Created</h2>
    <p style="margin:0 0 16px;">Hi ${recipientName},</p>
    <p style="margin:0 0 16px;"><strong>${patientName}</strong> has created a new health record release and has listed you as their authorized representative.</p>
    ${contactFooterHtml(contact)}
  `);

  const text = `Hi ${recipientName},\n\n${patientName} has created a new health record release and listed you as their authorized representative.${contactFooterText(contact)}`;

  await sendEmail({ to, subject, html, text });
}

export interface ReleaseSignatureRequiredEmailOptions {
  to: string;
  patientName: string;
  createdByName: string;
  releasesUrl: string;
  contact?: ContactInfo | null;
}

export async function sendReleaseSignatureRequiredEmail({
  to,
  patientName,
  createdByName,
  releasesUrl,
  contact,
}: ReleaseSignatureRequiredEmailOptions): Promise<void> {
  const subject = 'A release has been created on your behalf and requires your signature';

  const html = emailShell(`
    <h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111827;">Signature Required</h2>
    <p style="margin:0 0 16px;">Hi ${patientName},</p>
    <p style="margin:0 0 16px;"><strong>${createdByName}</strong> has created a health record release on your behalf that requires your signature before it can be processed.</p>
    <div style="margin:32px 0;">
      <a href="${releasesUrl}" style="display:inline-block;background:#228be6;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Review &amp; Sign</a>
    </div>
    ${contactFooterHtml(contact)}
  `);

  const text = `Hi ${patientName},\n\n${createdByName} has created a health record release on your behalf that requires your signature.\n\nReview and sign here: ${releasesUrl}${contactFooterText(contact)}`;

  await sendEmail({ to, subject, html, text });
}

export interface NewRecordUploadEmailOptions {
  to: string;
  patientName: string;
  uploadedByName: string;
  recordsUrl: string;
  contact?: ContactInfo | null;
}

export async function sendNewRecordUploadEmail({
  to,
  patientName,
  uploadedByName,
  recordsUrl,
  contact,
}: NewRecordUploadEmailOptions): Promise<void> {
  const subject = 'A new document has been uploaded to your account';

  const html = emailShell(`
    <h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111827;">New Document Uploaded</h2>
    <p style="margin:0 0 16px;">Hi ${patientName},</p>
    <p style="margin:0 0 24px;"><strong>${uploadedByName}</strong> has uploaded a new document to your account.</p>
    <div style="margin:32px 0;">
      <a href="${recordsUrl}" style="display:inline-block;background:#228be6;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">View My Records</a>
    </div>
    ${contactFooterHtml(contact)}
  `);

  const text = `Hi ${patientName},\n\n${uploadedByName} has uploaded a new document to your account.\n\nView your records here: ${recordsUrl}${contactFooterText(contact)}`;

  await sendEmail({ to, subject, html, text });
}

export interface PasswordResetEmailOptions {
  to: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({ to, resetUrl }: PasswordResetEmailOptions): Promise<void> {
  const subject = 'Reset your password';

  const html = emailShell(`
    <h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111827;">Reset Your Password</h2>
    <p style="margin:0 0 16px;">We received a request to reset the password for your account.</p>
    <p style="margin:0 0 24px;">Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>
    <div style="margin:32px 0;">
      <a href="${resetUrl}" style="display:inline-block;background:#228be6;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Reset Password</a>
    </div>
    ${contactFooterHtml(null)}
    <p style="margin:16px 0 0;color:#6b7280;font-size:14px;">If you did not request a password reset, you can safely ignore this email. Your password will not change.</p>
  `);

  const text = `We received a request to reset the password for your account.\n\nClick the link below to choose a new password (expires in 1 hour):\n${resetUrl}\n\nIf you did not request a password reset, you can safely ignore this email.`;

  await sendEmail({ to, subject, html, text });
}

export interface StaffInviteEmailOptions {
  to: string;
  firstName: string;
  role: 'admin' | 'agent';
  inviteUrl: string;
  inviterName: string;
}

export async function sendStaffInviteEmail({
  to,
  firstName,
  role,
  inviteUrl,
  inviterName,
}: StaffInviteEmailOptions): Promise<void> {
  const roleLabel = role === 'admin' ? 'Admin' : 'Agent';
  const subject = `You've been invited to join Zabaca as a ${roleLabel}`;

  const safeFirstName = escapeHtml(firstName);
  const safeInviterName = escapeHtml(inviterName);
  const safeInviteUrl = escapeHtml(inviteUrl);

  const html = emailShell(`
    <h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111827;">You've been invited to Zabaca</h2>
    <p style="margin:0 0 16px;">Hi ${safeFirstName},</p>
    <p style="margin:0 0 16px;"><strong>${safeInviterName}</strong> has invited you to join the Zabaca platform as an <strong>${roleLabel}</strong>.</p>
    <p style="margin:0 0 24px;">Click the button below to set up your account. This invite link expires in <strong>48 hours</strong>.</p>
    <div style="margin:32px 0;">
      <a href="${safeInviteUrl}" style="display:inline-block;background:#228be6;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Accept Invitation</a>
    </div>
    ${contactFooterHtml(null)}
  `);

  const text = `Hi ${firstName},\n\n${inviterName} has invited you to join the Zabaca platform as an ${roleLabel}.\n\nAccept your invitation here: ${inviteUrl}\n\nThis link expires in 48 hours.`;

  await sendEmail({ to, subject, html, text });
}

export interface InviteEmailOptions {
  to: string;
  inviteUrl: string;
  patientName: string;
  relationship?: string | null;
  contact?: ContactInfo | null;
}

export async function sendInviteEmail({ to, inviteUrl, patientName, relationship, contact }: InviteEmailOptions): Promise<void> {
  const relationshipLabel = relationship ? ` (${relationship})` : '';
  const subject = `You've been invited to access ${patientName}'s health records`;

  const html = emailShell(`
    <h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111827;">You've been invited</h2>
    <p style="margin:0 0 16px;"><strong>${patientName}</strong> has invited you${relationshipLabel} to be their Patient Designated Agent on the health records platform.</p>
    <p style="margin:0 0 16px;">As a Patient Designated Agent, you may be granted access to view documents, upload files, and manage provider information on their behalf — based on the permissions ${patientName} has configured.</p>
    <p style="margin:0 0 24px;">This invite link expires in <strong>48 hours</strong>.</p>
    <div style="margin:32px 0;">
      <a href="${inviteUrl}" style="display:inline-block;background:#228be6;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Accept Invitation</a>
    </div>
    ${contactFooterHtml(contact)}
  `);

  const text = `You've been invited by ${patientName}${relationshipLabel} to be their Patient Designated Agent.\n\nAccept the invitation here: ${inviteUrl}\n\nThis link expires in 48 hours.${contactFooterText(contact)}`;

  await sendEmail({ to, subject, html, text });
}
