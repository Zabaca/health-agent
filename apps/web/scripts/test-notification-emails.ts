/**
 * Sends a test email for each notification scenario.
 * Run with: bun run scripts/test-notification-emails.ts
 */

import { Resend } from 'resend';
import { getSiteBaseUrl } from '../src/lib/email';

const TO = 'foureight84@gmail.com';
const FROM = process.env.EMAIL_FROM ?? 'onboarding@resend.dev';
const resend = new Resend(process.env.RESEND_API_KEY);

// ── Helpers (mirrors email.ts internals) ─────────────────────────────────────

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

interface ContactInfo { name: string; email?: string }

function footerHtml(contact?: ContactInfo | null): string {
  if (contact === null) return '';
  if (contact === undefined) return '<p style="margin:24px 0 0;color:#6b7280;font-size:14px;">If you have any questions, please reach out to your care team.</p>';
  const ref = contact.email
    ? `<a href="mailto:${contact.email}" style="color:#228be6;text-decoration:none;">${contact.name}</a>`
    : `<strong>${contact.name}</strong>`;
  return `<p style="margin:24px 0 0;color:#6b7280;font-size:14px;">If you have any questions, please reach out to ${ref}.</p>`;
}

function footerText(contact?: ContactInfo | null): string {
  if (contact === null) return '';
  if (contact === undefined) return '\n\nIf you have any questions, please reach out to your care team.';
  const ref = contact.email ? `${contact.name} at ${contact.email}` : contact.name;
  return `\n\nIf you have any questions, please reach out to ${ref}.`;
}

function toIcsDate(d: Date) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }

const calBtnStyle = 'display:inline-block;margin:4px 6px 4px 0;padding:10px 18px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;';

async function send(scenario: string, subject: string, html: string, text: string) {
  const taggedSubject = `[TEST ${scenario}] ${subject}`;
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DRY RUN] Would send: "${taggedSubject}"`);
    return;
  }
  const { error } = await resend.emails.send({ from: FROM, to: TO, subject: taggedSubject, html, text });
  if (error) throw new Error(`Resend error (${scenario}): ${error.message}`);
  console.log(`✓ ${scenario}`);
  await new Promise(r => setTimeout(r, 300));
}

// ── Test data ─────────────────────────────────────────────────────────────────

const baseUrl = getSiteBaseUrl();
const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const formattedDate = new Date(scheduledAt).toLocaleString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
});

const PATIENT   = { name: 'John Doe',    email: 'john.doe@example.com' };
const AGENT     = { name: 'Jane Smith',  email: 'jane.smith@zabaca.com' };
const PDA       = { name: 'Alice Johnson', email: 'alice.j@example.com' };
const TEST_CALL_ID = 'test-call-00000000-0000-0000-0000-000000000000';

// Calendar buttons for scheduled call emails
const start = new Date(scheduledAt);
const end   = new Date(start.getTime() + 60 * 60 * 1000);
const t = encodeURIComponent('Scheduled Call');
const d = encodeURIComponent('A health call has been scheduled.');
const calUrls = {
  google:  `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${t}&dates=${toIcsDate(start)}/${toIcsDate(end)}&details=${d}`,
  outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${t}&startdt=${encodeURIComponent(start.toISOString())}&enddt=${encodeURIComponent(end.toISOString())}&body=${d}`,
  yahoo:   `https://calendar.yahoo.com/?v=60&title=${t}&st=${toIcsDate(start)}&et=${toIcsDate(end)}&desc=${d}`,
  ics:     `${baseUrl}/api/scheduled-calls/${TEST_CALL_ID}/ics`,
};
const calSection = `
  <div style="margin:32px 0 8px;">
    <p style="margin:0 0 12px;font-weight:600;color:#374151;">Add to Calendar</p>
    <a href="${calUrls.google}"  style="${calBtnStyle}background:#4285F4;color:#fff;">Google</a>
    <a href="${calUrls.outlook}" style="${calBtnStyle}background:#0078D4;color:#fff;">Outlook</a>
    <a href="${calUrls.yahoo}"   style="${calBtnStyle}background:#6001D2;color:#fff;">Yahoo</a>
    <a href="${calUrls.ics}"     style="${calBtnStyle}background:#1c1c1e;color:#fff;">Apple / ICS</a>
  </div>`;
const calText = `\n\nAdd to Calendar:\n  Google:  ${calUrls.google}\n  Outlook: ${calUrls.outlook}\n  Yahoo:   ${calUrls.yahoo}\n  ICS:     ${calUrls.ics}`;

// ── Scenarios ─────────────────────────────────────────────────────────────────

async function main() {
  // 1. Patient schedules call → agent notified (no footer — patient-originated, agent recipient)
  await send(
    'Patient Schedules Call - Agent Notified',
    `A call has been scheduled with you on ${formattedDate}`,
    emailShell(`
      <h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111827;">Call Scheduled</h2>
      <p style="margin:0 0 16px;">Hi ${AGENT.name},</p>
      <p style="margin:0 0 16px;"><strong>${PATIENT.name}</strong> has scheduled a call with you.</p>
      <p style="margin:0 0 16px;font-size:18px;"><strong>Date &amp; Time:</strong> ${formattedDate}</p>
      ${calSection}
      ${footerHtml(null)}
    `),
    `Hi ${AGENT.name},\n\n${PATIENT.name} has scheduled a call with you.\n\nDate & Time: ${formattedDate}${calText}${footerText(null)}`,
  );

  // 2. Agent schedules call → patient notified (contact = agent name + email)
  await send(
    'Agent Schedules Call - Patient Notified',
    `A call has been scheduled with you on ${formattedDate}`,
    emailShell(`
      <h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111827;">Call Scheduled</h2>
      <p style="margin:0 0 16px;">Hi ${PATIENT.name},</p>
      <p style="margin:0 0 16px;"><strong>${AGENT.name}</strong> has scheduled a call with you.</p>
      <p style="margin:0 0 16px;font-size:18px;"><strong>Date &amp; Time:</strong> ${formattedDate}</p>
      ${calSection}
      ${footerHtml(AGENT)}
    `),
    `Hi ${PATIENT.name},\n\n${AGENT.name} has scheduled a call with you.\n\nDate & Time: ${formattedDate}${calText}${footerText(AGENT)}`,
  );

  // 3. Admin schedules call → patient notified (no footer — admin has no personal contact)
  await send(
    'Admin Schedules Call - Patient Notified',
    `A call has been scheduled with you on ${formattedDate}`,
    emailShell(`
      <h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111827;">Call Scheduled</h2>
      <p style="margin:0 0 16px;">Hi ${PATIENT.name},</p>
      <p style="margin:0 0 16px;"><strong>Admin</strong> has scheduled a call with you.</p>
      <p style="margin:0 0 16px;font-size:18px;"><strong>Date &amp; Time:</strong> ${formattedDate}</p>
      ${calSection}
      ${footerHtml(null)}
    `),
    `Hi ${PATIENT.name},\n\nAdmin has scheduled a call with you.\n\nDate & Time: ${formattedDate}${calText}${footerText(null)}`,
  );

  // 4. Admin schedules call → agent notified (no footer)
  await send(
    'Admin Schedules Call - Agent Notified',
    `A call has been scheduled with you on ${formattedDate}`,
    emailShell(`
      <h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111827;">Call Scheduled</h2>
      <p style="margin:0 0 16px;">Hi ${AGENT.name},</p>
      <p style="margin:0 0 16px;"><strong>Admin</strong> has scheduled a call with you.</p>
      <p style="margin:0 0 16px;font-size:18px;"><strong>Date &amp; Time:</strong> ${formattedDate}</p>
      ${calSection}
      ${footerHtml(null)}
    `),
    `Hi ${AGENT.name},\n\nAdmin has scheduled a call with you.\n\nDate & Time: ${formattedDate}${calText}${footerText(null)}`,
  );

  // 5. Patient creates release → authorized agent notified (contact = patient name only)
  await send(
    'Patient Creates Release - Authorized Agent Notified',
    `${PATIENT.name} has created a new health release`,
    emailShell(`
      <h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111827;">New Release Created</h2>
      <p style="margin:0 0 16px;">Hi ${AGENT.name},</p>
      <p style="margin:0 0 16px;"><strong>${PATIENT.name}</strong> has created a new health record release and has listed you as their authorized representative.</p>
      ${footerHtml({ name: PATIENT.name })}
    `),
    `Hi ${AGENT.name},\n\n${PATIENT.name} has created a new health record release and listed you as their authorized representative.${footerText({ name: PATIENT.name })}`,
  );

  // 6. Agent creates release → patient notified for signature (contact = agent name + email)
  await send(
    'Agent Creates Release - Patient Signature Required',
    'A release has been created on your behalf and requires your signature',
    emailShell(`
      <h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111827;">Signature Required</h2>
      <p style="margin:0 0 16px;">Hi ${PATIENT.name},</p>
      <p style="margin:0 0 16px;"><strong>${AGENT.name}</strong> has created a health record release on your behalf that requires your signature before it can be processed.</p>
      <div style="margin:32px 0;">
        <a href="${baseUrl}/releases" style="display:inline-block;background:#228be6;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Review &amp; Sign</a>
      </div>
      ${footerHtml(AGENT)}
    `),
    `Hi ${PATIENT.name},\n\n${AGENT.name} has created a health record release on your behalf that requires your signature.\n\nReview and sign here: ${baseUrl}/releases${footerText(AGENT)}`,
  );

  // 7. PDA creates release → patient notified for signature (contact = PDA name + email)
  await send(
    'PDA Creates Release - Patient Signature Required',
    'A release has been created on your behalf and requires your signature',
    emailShell(`
      <h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111827;">Signature Required</h2>
      <p style="margin:0 0 16px;">Hi ${PATIENT.name},</p>
      <p style="margin:0 0 16px;"><strong>${PDA.name}</strong> has created a health record release on your behalf that requires your signature before it can be processed.</p>
      <div style="margin:32px 0;">
        <a href="${baseUrl}/releases" style="display:inline-block;background:#228be6;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Review &amp; Sign</a>
      </div>
      ${footerHtml(PDA)}
    `),
    `Hi ${PATIENT.name},\n\n${PDA.name} has created a health record release on your behalf that requires your signature.\n\nReview and sign here: ${baseUrl}/releases${footerText(PDA)}`,
  );

  // 8. Agent uploads record → patient notified (contact = agent name + email)
  await send(
    'Agent Uploads Record - Patient Notified',
    'A new document has been uploaded to your account',
    emailShell(`
      <h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111827;">New Document Uploaded</h2>
      <p style="margin:0 0 16px;">Hi ${PATIENT.name},</p>
      <p style="margin:0 0 24px;"><strong>${AGENT.name}</strong> has uploaded a new document to your account.</p>
      <div style="margin:32px 0;">
        <a href="${baseUrl}/my-records" style="display:inline-block;background:#228be6;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">View My Records</a>
      </div>
      ${footerHtml(AGENT)}
    `),
    `Hi ${PATIENT.name},\n\n${AGENT.name} has uploaded a new document to your account.\n\nView your records here: ${baseUrl}/my-records${footerText(AGENT)}`,
  );

  // 9. PDA uploads record → patient notified (contact = PDA name + email)
  await send(
    'PDA Uploads Record - Patient Notified',
    'A new document has been uploaded to your account',
    emailShell(`
      <h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111827;">New Document Uploaded</h2>
      <p style="margin:0 0 16px;">Hi ${PATIENT.name},</p>
      <p style="margin:0 0 24px;"><strong>${PDA.name}</strong> has uploaded a new document to your account.</p>
      <div style="margin:32px 0;">
        <a href="${baseUrl}/my-records" style="display:inline-block;background:#228be6;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">View My Records</a>
      </div>
      ${footerHtml(PDA)}
    `),
    `Hi ${PATIENT.name},\n\n${PDA.name} has uploaded a new document to your account.\n\nView your records here: ${baseUrl}/my-records${footerText(PDA)}`,
  );

  // 10. Patient invites PDA (contact = patient name only)
  const inviteUrl = `${baseUrl}/invite/accept?token=test-token-00000000`;
  await send(
    'Patient Invites PDA',
    `You've been invited to access ${PATIENT.name}'s health records`,
    emailShell(`
      <h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111827;">You've been invited</h2>
      <p style="margin:0 0 16px;"><strong>${PATIENT.name}</strong> has invited you (Son) to be their Patient Designated Agent on the health records platform.</p>
      <p style="margin:0 0 16px;">As a Patient Designated Agent, you may be granted access to view documents, upload files, and manage provider information on their behalf — based on the permissions ${PATIENT.name} has configured.</p>
      <p style="margin:0 0 24px;">This invite link expires in <strong>48 hours</strong>.</p>
      <div style="margin:32px 0;">
        <a href="${inviteUrl}" style="display:inline-block;background:#228be6;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Accept Invitation</a>
      </div>
      ${footerHtml({ name: PATIENT.name })}
    `),
    `You've been invited by ${PATIENT.name} (Son) to be their Patient Designated Agent.\n\nAccept the invitation here: ${inviteUrl}\n\nThis link expires in 48 hours.${footerText({ name: PATIENT.name })}`,
  );

  console.log(`\nAll 10 test emails sent to ${TO}`);
}

main().catch(console.error);
