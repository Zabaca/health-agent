import { NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { releases as releasesTable, providers as providersTable } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { decryptPii } from "@/lib/crypto";

function esc(v: string | null | undefined): string {
  if (!v) return "";
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function field(label: string, value: string | null | undefined): string {
  return `<div class="field"><div class="field-label">${esc(label)}</div><div class="field-value">${esc(value) || "—"}</div></div>`;
}

function checkbox(label: string, checked: boolean): string {
  return `<div class="check-item"><div class="check-box${checked ? " checked" : ""}"></div><span class="check-label">${esc(label)}</span></div>`;
}

function buildProviderSection(p: {
  providerName: string; providerType: string; physicianName: string | null;
  patientId: string | null; insurance: string | null; patientMemberId: string | null;
  groupId: string | null; planName: string | null; phone: string | null;
  fax: string | null; providerEmail: string | null; address: string | null;
  membershipIdFront: string | null; membershipIdBack: string | null;
  historyPhysical: boolean; diagnosticResults: boolean; treatmentProcedure: boolean;
  prescriptionMedication: boolean; imagingRadiology: boolean; dischargeSummaries: boolean;
  specificRecords: boolean; specificRecordsDesc: string | null;
  benefitsCoverage: boolean; claimsPayment: boolean; eligibilityEnrollment: boolean;
  financialBilling: boolean; medicalRecords: boolean; dentalRecords: boolean;
  otherNonSpecific: boolean; otherNonSpecificDesc: string | null;
  sensitiveCommDiseases: boolean; sensitiveReproductiveHealth: boolean;
  sensitiveHivAids: boolean; sensitiveMentalHealth: boolean;
  sensitiveSubstanceUse: boolean; sensitivePsychotherapy: boolean;
  sensitiveOther: boolean; sensitiveOtherDesc: string | null;
  dateRangeFrom: string | null; dateRangeTo: string | null;
  allAvailableDates: boolean; purpose: string | null; purposeOther: string | null;
}, index: number): string {
  const displayName = p.providerType === "Insurance"
    ? (p.insurance || p.providerName)
    : p.providerName;

  const isInsurance = p.providerType === "Insurance";
  const isHospitalOrFacility = p.providerType === "Hospital" || p.providerType === "Facility";

  let recordsHtml = "";
  if (isInsurance) {
    recordsHtml = `<div class="checks-grid">
      ${checkbox("Benefits and Coverage", p.benefitsCoverage)}
      ${checkbox("Claims and Payment", p.claimsPayment)}
      ${checkbox("Eligibility and Enrollment", p.eligibilityEnrollment)}
      ${checkbox("Financial/Billing Information", p.financialBilling)}
    </div>`;
  } else if (isHospitalOrFacility) {
    recordsHtml = `<div class="checks-grid">
      ${checkbox("Medical Records", p.medicalRecords)}
      ${checkbox("Dental Records", p.dentalRecords)}
      ${checkbox("Other Non-Specific", p.otherNonSpecific)}
    </div>
    ${p.otherNonSpecific && p.otherNonSpecificDesc ? field("Other Non-Specific Details", p.otherNonSpecificDesc) : ""}`;
  } else {
    recordsHtml = `<div class="checks-grid">
      ${checkbox("History & Physical", p.historyPhysical)}
      ${checkbox("Diagnostic Results", p.diagnosticResults)}
      ${checkbox("Treatment/Procedure Notes", p.treatmentProcedure)}
      ${checkbox("Prescription/Medication", p.prescriptionMedication)}
      ${checkbox("Imaging/Radiology", p.imagingRadiology)}
      ${checkbox("Discharge Summaries", p.dischargeSummaries)}
      ${checkbox("Specific Records", p.specificRecords)}
    </div>
    ${p.specificRecords && p.specificRecordsDesc ? field("Specific Records Description", p.specificRecordsDesc) : ""}`;
  }

  const sensitiveHtml = (isInsurance || isHospitalOrFacility) ? `
    <div class="subsection-title">Sensitive Information to be Disclosed</div>
    <div class="checks-grid">
      ${checkbox("Communicable Diseases", p.sensitiveCommDiseases)}
      ${checkbox("Reproductive Health", p.sensitiveReproductiveHealth)}
      ${checkbox("HIV/AIDS status or testing results", p.sensitiveHivAids)}
      ${checkbox("Mental Health / Behavior Health records", p.sensitiveMentalHealth)}
      ${checkbox("Substance Use Disorder (Alcohol/Drug treatment)", p.sensitiveSubstanceUse)}
      ${checkbox("Psychotherapy Notes", p.sensitivePsychotherapy)}
      ${checkbox("Other (Specify)", p.sensitiveOther)}
    </div>
    ${p.sensitiveOther && p.sensitiveOtherDesc ? field("Sensitive Other Details", p.sensitiveOtherDesc) : ""}
  ` : "";

  const dateRangeHtml = p.allAvailableDates
    ? `<div class="field-value" style="margin-bottom:10px">All available dates</div>`
    : `<div class="field-grid-2">${field("From", p.dateRangeFrom)}${field("To", p.dateRangeTo)}</div>`;

  const purposeValue = p.purpose === "Other"
    ? `Other — ${p.purposeOther || ""}`
    : p.purpose;

  const insuranceFieldsHtml = isInsurance ? `
    <div class="field-grid-3" style="margin-bottom:10px">
      ${field("Insurance", p.insurance)}
      ${field("Insurance Member ID", p.patientMemberId)}
      ${field("Insurance Group ID", p.groupId)}
      ${field("Insurance Plan Name", p.planName)}
    </div>
  ` : "";

  const patientIdHtml = p.providerType === "Hospital" && p.patientId
    ? field("Patient ID", p.patientId)
    : "";

  const addressHtml = !isInsurance ? field("Address", p.address) : "";

  return `
    ${index > 0 ? '<hr class="provider-divider">' : ""}
    <div class="provider-name">${esc(displayName)}</div>
    ${patientIdHtml}
    ${insuranceFieldsHtml}
    <div class="field-grid-3" style="margin-bottom:10px">
      ${field("Phone", p.phone)}
      ${field("Fax", p.fax)}
      ${field("Email", p.providerEmail)}
    </div>
    ${addressHtml}
    <hr class="dashed">
    <div class="subsection-title">Records to Release</div>
    ${recordsHtml}
    ${sensitiveHtml}
    <div class="subsection-title">Date Range</div>
    ${dateRangeHtml}
    ${purposeValue ? field("Purpose of Release", purposeValue) : ""}
  `;
}

function buildHtml(release: ReturnType<typeof decryptPii> & { providers: Parameters<typeof buildProviderSection>[0][] }): string {
  const { ssn, dateOfBirth, ...r } = release as {
    ssn: string | null;
    dateOfBirth: string;
    firstName: string; middleName: string | null; lastName: string;
    mailingAddress: string; phoneNumber: string; email: string;
    releaseAuthAgent: boolean;
    authAgentFirstName: string | null; authAgentLastName: string | null;
    authAgentOrganization: string | null; authAgentAddress: string | null;
    authAgentPhone: string | null; authAgentEmail: string | null;
    authExpirationDate: string | null; authExpirationEvent: string | null;
    authPrintedName: string; authSignatureImage: string | null; authDate: string;
    releaseCode: string | null;
    createdAt: string; updatedAt: string;
    voided: boolean;
    providers: Parameters<typeof buildProviderSection>[0][];
  };

  const ssnDisplay = ssn ? `••• – •• – ${esc(ssn)}` : "—";
  const agentName = [r.authAgentFirstName, r.authAgentLastName].filter(Boolean).join(" ");
  const code = esc(r.releaseCode ?? "—");

  const agentSectionHtml = r.releaseAuthAgent ? `
    <div class="inset-card">
      <div class="subsection-title" style="margin-top:0">Individual/Organization to Receive the Information</div>
      <div class="field-grid-3">
        ${field("First Name", r.authAgentFirstName)}
        ${field("Last Name", r.authAgentLastName)}
        ${field("Relationship to Patient", "Authorized Representative")}
        ${field("Organization", r.authAgentOrganization)}
        ${field("Phone Number", r.authAgentPhone)}
        ${field("Email", r.authAgentEmail)}
      </div>
      ${field("Address", r.authAgentAddress)}
    </div>
  ` : "";

  const signatureHtml = r.authSignatureImage
    ? `<div class="field"><div class="field-label">Patient Signature</div><img src="${r.authSignatureImage}" alt="Signature" style="max-width:200px;max-height:80px;display:block;margin-top:4px;" /></div>`
    : `<div class="field"><div class="field-label">Patient Signature</div><div class="field-value pending-sig">Pending patient signature</div></div>`;

  const voidedBanner = r.voided ? `<div class="voided-banner">⚠ This release has been voided</div>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>HIPAA Release — ${esc(r.firstName)} ${esc(r.lastName)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; font-size: 11px; color: #1a1a2e; background: #fff; line-height: 1.3; }
  @page {
    margin: 0.35in 0.5in 0.8in 0.5in;
    size: letter;
    @bottom-right {
      content: "${code}  ·  Page " counter(page) " of " counter(pages);
      font-size: 8pt;
      color: #8a9ab5;
      font-family: monospace;
    }
  }
  @media print { body { background: #fff; } }
  html, body { margin: 0; padding: 0; }

  .page { padding: 0.3in 0.35in 0.4in; }
  .page + .page { page-break-before: always; }

  .page-header { padding-bottom: 12px; }

  .doc-title {
    text-align: center;
    font-size: 10pt;
    font-weight: 700;
    color: #1e3a5f;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    border-bottom: 2px solid #1e3a5f;
    padding-bottom: 10px;
    white-space: nowrap;
  }

  .section {
    border: 1px solid #c4d9ee;
    border-top: 3px solid #1e3a5f;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 14px;
    page-break-inside: avoid;
  }

  .section-title {
    font-size: 13px;
    font-weight: 700;
    color: #1e3a5f;
    border-bottom: 1px solid #c4d9ee;
    padding-bottom: 8px;
    margin-bottom: 14px;
  }

  .provider-name { font-size: 13px; font-weight: 700; color: #1e3a5f; margin-bottom: 12px; }

  .subsection-title { font-size: 11px; font-weight: 700; color: #2d6da4; margin: 14px 0 8px; }

  .field { margin-bottom: 10px; }
  .field-label { font-size: 10px; font-weight: 500; color: #6b88b0; margin-bottom: 2px; }
  .field-value { font-size: 11px; color: #1a1a2e; }
  .field-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
  .field-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0 16px; }

  .checks-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px 16px; margin-bottom: 8px; }
  .check-item { display: flex; align-items: flex-start; gap: 6px; }
  .check-box {
    width: 12px; height: 12px;
    border: 1.5px solid #000;
    border-radius: 2px;
    flex-shrink: 0;
    margin-top: 1px;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .check-box.checked { background: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .check-label { font-size: 11px; color: #1a1a2e; line-height: 1.3; }

  .code-box { border: 1px solid #2d6da4; border-radius: 6px; padding: 10px 14px; margin: 12px 0; background: #f0f7fd; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .code-label { font-size: 11px; font-weight: 700; color: #2d6da4; margin-bottom: 4px; }
  .code-value { font-family: "Courier New", monospace; font-size: 14px; font-weight: 700; color: #1a1a2e; letter-spacing: 1px; }

  .inset-card { border: 1px solid #2d6da4; border-radius: 6px; padding: 12px; margin: 12px 0; background: #f0f7fd; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  hr { border: none; border-top: 1px solid #c4d9ee; margin: 14px 0; }
  hr.dashed { border-top-style: dashed; }
  .provider-divider { border-top: 1px solid #c4d9ee; margin: 16px 0; }

  .voided-banner { background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; font-weight: 600; color: #856404; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  .auth-text { font-style: italic; font-size: 11px; margin-bottom: 16px; line-height: 1.5; }
  .pending-sig { color: #8a9ab5; font-style: italic; }

  .footer { text-align: right; color: #8a9ab5; font-size: 10px; margin-top: 16px; border-top: 1px solid #c4d9ee; padding-top: 6px; }
</style>
</head>
<body>
  <!-- Page 1: Patient Info + Authorization -->
  <div class="page">
    <div class="page-header">
      <div class="doc-title">Authorization for the Release of Protected Health Information</div>
    </div>
    ${voidedBanner}
    <div class="section">
      <div class="section-title">Patient Information</div>
      <div class="field-grid-3">
        ${field("First Name", r.firstName)}
        ${field("Middle Name", r.middleName)}
        ${field("Last Name", r.lastName)}
        ${field("Date of Birth", dateOfBirth)}
        ${field("Social Security Number", ssnDisplay)}
      </div>
      ${field("Mailing Address", r.mailingAddress)}
    </div>
    <div class="section">
      <div class="section-title">Authorization</div>
      <p class="auth-text">
        ${esc(r.firstName)} ${esc(r.lastName)} (Patient) hereby authorizes
        ${r.releaseAuthAgent
          ? `${esc(agentName)} (Authorized Representative) as the acting agent in requesting medical records on the patient's behalf.`
          : "the release of their medical records as described in this document."
        }
      </p>
      ${agentSectionHtml}
      <div class="code-box">
        <div class="code-label">Release Code</div>
        <div class="code-value">${code}</div>
      </div>
      <div class="field-grid-2">
        ${field("Authorization Expiration Date", r.authExpirationDate)}
        ${field("Expiration Event", r.authExpirationEvent)}
      </div>
      <div class="field-grid-2">
        ${field("Patient Printed Name", r.authPrintedName)}
        ${field("Date", r.authDate)}
      </div>
      ${signatureHtml}
    </div>
    <div class="footer">${code} &middot; Page 1 of 2</div>
  </div>

  <!-- Page 2: Healthcare Provider -->
  <div class="page">
    <div class="page-header">
      <div class="doc-title">Authorization for the Release of Protected Health Information</div>
    </div>
    <div class="section">
      <div class="section-title">Healthcare Provider</div>
      ${release.providers.map((p, i) => buildProviderSection(p, i)).join("")}
    </div>
    <div class="footer">
      ${code} &middot; Page 2 of 2 &nbsp;&nbsp;&nbsp; Created ${new Date(r.createdAt).toLocaleDateString()} · Updated ${new Date(r.updatedAt).toLocaleDateString()}
    </div>
  </div>
</body>
</html>`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const { id } = await params;

  const row = await db.query.releases.findFirst({
    where: and(eq(releasesTable.id, id), eq(releasesTable.userId, result.userId)),
    with: { providers: { orderBy: [asc(providersTable.order)] } },
  });

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const release = decryptPii(row) as typeof row;
  const html = buildHtml(release as Parameters<typeof buildHtml>[0]);

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
