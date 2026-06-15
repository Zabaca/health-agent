/**
 * Seed mock health records for a user (clinical FHIR records + uploaded PDFs).
 *
 * Usage (from apps/web):
 *   bun run scripts/seed-mock-records.ts [email]
 *   # default email: jsmith@mailinator.com
 *
 * Idempotent: FHIR rows upsert on (patientId, source, externalId); uploaded
 * documents are replaced (old R2 object + row deleted, fresh PDF re-uploaded)
 * so refreshed mock content lands on re-run; providers insert by name and skip
 * any already present. Safe to re-run.
 *
 * - FHIR records  → source 'healthkitFHIR', encrypted FHIR JSON in dataBlob.
 *                   These appear in the mobile "My Records" list + detail views.
 * - Uploaded docs → source 'upload', real (encrypted) PDF bytes in R2, with a
 *                   fileUploadLog row supplying the display name.
 * - Providers     → userProviders rows (the patient's "My Providers" list),
 *                   corresponding to the record sources above.
 */
import { randomUUID } from "crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../src/lib/db";
import { incomingFiles, fileUploadLog, userProviders, users } from "../src/lib/db/schema";
import { encrypt } from "../src/lib/crypto";
import { uploadToR2, deleteFromR2 } from "../src/lib/r2";

const FHIR_SOURCE = "healthkitFHIR";
const UPLOAD_SOURCE = "upload";
const email = process.argv[2] ?? "jsmith@mailinator.com";

// ─── FHIR record definitions ────────────────────────────────────────────────
// `recordType` is the HealthKit category (drives labels + lab-panel grouping).
// `resourceType` is the FHIR resourceType (stored in the cleartext `type`
// column; drives the detail renderer). `displayName` is what the list shows.

type FhirRec = {
  recordType: string;
  resourceType: string;
  displayName: string;
  effectiveDate: string;
  sourceName: string;
  fhirData: Record<string, unknown>;
};

function cc(text: string, code?: string, system = "http://loinc.org") {
  return { text, coding: code ? [{ system, code, display: text }] : [{ display: text }] };
}

// Chemistry/CBC panel — same date + source so the list collapses these into a
// single "Lab Panel" row (see groupLabPanels in RecordsList.tsx).
const LAB_DATE = "2026-05-20T09:30:00.000Z";
const LAB_SOURCE = "MyQuest";
type Lab = { name: string; loinc: string; value: number; unit: string; low?: number; high?: number; interpretation?: string };
const LABS: Lab[] = [
  { name: "White Blood Cell Count", loinc: "6690-2", value: 6.2, unit: "10*3/uL", low: 3.4, high: 10.8 },
  { name: "Red Blood Cell Count", loinc: "789-8", value: 4.8, unit: "10*6/uL", low: 4.14, high: 5.8 },
  { name: "Hemoglobin", loinc: "718-7", value: 14.5, unit: "g/dL", low: 13.0, high: 17.7 },
  { name: "Hematocrit", loinc: "4544-3", value: 43, unit: "%", low: 37.5, high: 51.0 },
  { name: "Platelet Count", loinc: "777-3", value: 250, unit: "10*3/uL", low: 150, high: 400 },
  { name: "Glucose", loinc: "2345-7", value: 88, unit: "mg/dL", low: 65, high: 99 },
  { name: "Cholesterol, Total", loinc: "2093-3", value: 175, unit: "mg/dL", high: 200 },
  { name: "Vitamin D, 25-Hydroxy", loinc: "1989-3", value: 45, unit: "ng/mL", low: 30, high: 100 },
];

const labRecords: FhirRec[] = LABS.map((l) => ({
  recordType: "LabResultRecord",
  resourceType: "Observation",
  displayName: l.name,
  effectiveDate: LAB_DATE,
  sourceName: LAB_SOURCE,
  fhirData: {
    resourceType: "Observation",
    status: "final",
    category: [cc("Laboratory")],
    code: cc(l.name, l.loinc),
    effectiveDateTime: LAB_DATE,
    valueQuantity: { value: l.value, unit: l.unit },
    ...(l.interpretation
      ? { interpretation: [cc(l.interpretation, l.interpretation === "High" ? "H" : "L", "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation")] }
      : { interpretation: [cc("Normal", "N", "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation")] }),
    referenceRange: [{
      ...(l.low !== undefined ? { low: { value: l.low, unit: l.unit } } : {}),
      ...(l.high !== undefined ? { high: { value: l.high, unit: l.unit } } : {}),
      text: l.low !== undefined && l.high !== undefined ? `${l.low}–${l.high} ${l.unit}` : l.high !== undefined ? `< ${l.high} ${l.unit}` : undefined,
    }],
    performer: [{ display: LAB_SOURCE }],
  },
}));

const otherRecords: FhirRec[] = [
  {
    // Resolved (no longer active) — corrected on supplementation; shows as
    // history, not an active chronic problem.
    recordType: "ConditionRecord",
    resourceType: "Condition",
    displayName: "Vitamin D deficiency (resolved)",
    effectiveDate: "2025-09-15T00:00:00.000Z",
    sourceName: "MyChart",
    fhirData: {
      resourceType: "Condition",
      clinicalStatus: cc("Resolved", "resolved", "http://terminology.hl7.org/CodeSystem/condition-clinical"),
      verificationStatus: cc("Confirmed", "confirmed", "http://terminology.hl7.org/CodeSystem/condition-ver-status"),
      code: cc("Vitamin D deficiency", "E55.9", "http://hl7.org/fhir/sid/icd-10-cm"),
      onsetDateTime: "2025-09-15T00:00:00.000Z",
      abatementDateTime: "2026-05-20T00:00:00.000Z",
      recordedDate: "2025-09-15T00:00:00.000Z",
      recorder: { display: "Dr. Sarah Chen, MD" },
    },
  },
  {
    // Past acute illness, fully resolved — no chronic disease.
    recordType: "ConditionRecord",
    resourceType: "Condition",
    displayName: "Acute viral pharyngitis (resolved)",
    effectiveDate: "2025-01-12T00:00:00.000Z",
    sourceName: "MyChart",
    fhirData: {
      resourceType: "Condition",
      clinicalStatus: cc("Resolved", "resolved", "http://terminology.hl7.org/CodeSystem/condition-clinical"),
      verificationStatus: cc("Confirmed", "confirmed", "http://terminology.hl7.org/CodeSystem/condition-ver-status"),
      code: cc("Acute viral pharyngitis", "J02.8", "http://hl7.org/fhir/sid/icd-10-cm"),
      onsetDateTime: "2025-01-12T00:00:00.000Z",
      abatementDateTime: "2025-01-22T00:00:00.000Z",
      recordedDate: "2025-01-12T00:00:00.000Z",
      recorder: { display: "Dr. Sarah Chen, MD" },
    },
  },
  {
    recordType: "MedicationRecord",
    resourceType: "MedicationStatement",
    displayName: "Vitamin D3 2000 IU",
    effectiveDate: "2025-09-15T00:00:00.000Z",
    sourceName: "MyChart",
    fhirData: {
      resourceType: "MedicationStatement",
      status: "active",
      medicationCodeableConcept: cc("Cholecalciferol (Vitamin D3) 2000 IU Oral Tablet", "1819193", "http://www.nlm.nih.gov/research/umls/rxnorm"),
      effectiveDateTime: "2025-09-15T00:00:00.000Z",
      dosage: [{ text: "2000 IU by mouth once daily" }],
    },
  },
  {
    recordType: "MedicationRecord",
    resourceType: "MedicationStatement",
    displayName: "Daily Multivitamin",
    effectiveDate: "2025-01-01T00:00:00.000Z",
    sourceName: "MyChart",
    fhirData: {
      resourceType: "MedicationStatement",
      status: "active",
      medicationCodeableConcept: cc("Multivitamin preparation Oral Tablet", "316671", "http://www.nlm.nih.gov/research/umls/rxnorm"),
      effectiveDateTime: "2025-01-01T00:00:00.000Z",
      dosage: [{ text: "1 tablet by mouth once daily" }],
    },
  },
  {
    recordType: "ImmunizationRecord",
    resourceType: "Immunization",
    displayName: "Influenza vaccine",
    effectiveDate: "2025-10-12T00:00:00.000Z",
    sourceName: "MyChart",
    fhirData: {
      resourceType: "Immunization",
      status: "completed",
      vaccineCode: cc("Influenza, seasonal, injectable", "141", "http://hl7.org/fhir/sid/cvx"),
      occurrenceDateTime: "2025-10-12T00:00:00.000Z",
      lotNumber: "FLU2025-0088",
      manufacturer: { display: "Sanofi Pasteur" },
    },
  },
  {
    recordType: "AllergyRecord",
    resourceType: "AllergyIntolerance",
    displayName: "Penicillin",
    effectiveDate: "2020-06-01T00:00:00.000Z",
    sourceName: "MyChart",
    fhirData: {
      resourceType: "AllergyIntolerance",
      clinicalStatus: cc("Active", "active", "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical"),
      verificationStatus: cc("Confirmed", "confirmed", "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification"),
      category: ["medication"],
      criticality: "high",
      code: cc("Penicillin G", "7980", "http://www.nlm.nih.gov/research/umls/rxnorm"),
      recordedDate: "2020-06-01T00:00:00.000Z",
      reaction: [{ manifestation: [cc("Hives (urticaria)")], severity: "moderate" }],
    },
  },
];

const allFhir = [...labRecords, ...otherRecords];

// ─── Uploaded document definitions ──────────────────────────────────────────

type Doc = { slug: string; originalName: string; title: string; lines: string[] };
const DOCS: Doc[] = [
  {
    slug: "chest-xray",
    originalName: "Chest X-Ray Report.pdf",
    title: "Radiology Report — Chest X-Ray (PA & Lateral)",
    lines: [
      "Patient: John Smith        DOB: 12/26/1989",
      "Exam date: 2026-04-18      Ordering provider: Dr. Sarah Chen, MD",
      "",
      "INDICATION: Annual screening; intermittent cough.",
      "",
      "FINDINGS:",
      "  Lungs are clear and well expanded. No focal consolidation,",
      "  effusion, or pneumothorax. Cardiomediastinal silhouette is",
      "  within normal limits. No acute osseous abnormality.",
      "",
      "IMPRESSION:",
      "  No acute cardiopulmonary process.",
      "",
      "  -- SAMPLE / MOCK REPORT — NOT FOR CLINICAL USE --",
    ],
  },
  {
    slug: "visit-summary",
    originalName: "Visit Summary - Annual Physical.pdf",
    title: "Visit Summary — Annual Physical Exam",
    lines: [
      "Patient: John Smith        DOB: 12/26/1989",
      "Visit date: 2026-05-20     Provider: Dr. Sarah Chen, MD",
      "",
      "VITALS: BP 118/76  HR 64  Temp 98.4F  BMI 22.8",
      "",
      "ASSESSMENT & PLAN:",
      "  1. Healthy adult — no acute concerns. Exam unremarkable.",
      "  2. Labs (CBC, glucose, lipids) all within normal limits.",
      "  3. Vitamin D previously low, now normal on supplementation;",
      "     continue vitamin D3 2000 IU daily.",
      "",
      "  Up to date on immunizations. Routine follow-up in 12 months.",
      "",
      "  -- SAMPLE / MOCK SUMMARY — NOT FOR CLINICAL USE --",
    ],
  },
];

// ─── Provider definitions (My Providers) ────────────────────────────────────
// These correspond to the record sources above: the primary-care practice that
// recorded the conditions/medications/immunization (recorder "Dr. Sarah Chen"),
// the lab that ran the panel (source "MyQuest"), and the imaging center that
// produced the chest X-Ray report. providerType ∈ {Hospital, Facility, Insurance}.

type ProviderSeed = {
  providerType: "Hospital" | "Facility" | "Insurance";
  providerName: string;
  physicianName?: string;
  phone?: string;
  fax?: string;
  providerEmail?: string;
  address?: string;
};
const PROVIDERS: ProviderSeed[] = [
  {
    providerType: "Hospital",
    providerName: "Bayview Family Medicine",
    physicianName: "Sarah Chen, MD",
    phone: "(617) 555-0142",
    fax: "(617) 555-0143",
    providerEmail: "records@bayviewfm.example.com",
    address: "210 Harborview Ave, Boston, MA 02114",
  },
  {
    providerType: "Facility",
    providerName: "Quest Diagnostics",
    phone: "(866) 697-8378",
    fax: "(201) 555-0190",
    address: "500 Plaza Dr, Secaucus, NJ 07094",
  },
  {
    providerType: "Facility",
    providerName: "Bayview Imaging Center",
    phone: "(617) 555-0188",
    fax: "(617) 555-0189",
    address: "215 Harborview Ave, Boston, MA 02114",
  },
];

/** Build a minimal valid single-page PDF (Helvetica) with computed xref. */
function buildPdf(title: string, lines: string[]): Buffer {
  const esc = (s: string) => s.replace(/([\\()])/g, "\\$1");
  const rows = [{ size: 18, text: title }, { size: 11, text: "" }, ...lines.map((t) => ({ size: 11, text: t }))];
  let stream = "BT\n";
  let y = 740;
  for (const r of rows) {
    stream += `/F1 ${r.size} Tf\n1 0 0 1 72 ${y} Tm\n(${esc(r.text)}) Tj\n`;
    y -= r.size + 7;
  }
  stream += "ET";

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefStart = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) pdf += String(off).padStart(10, "0") + " 00000 n \n";
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

async function main() {
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) {
    console.error(`✗ No user found with email "${email}". Aborting.`);
    process.exit(1);
  }
  const patientId = user.id;
  console.log(`✓ Found user ${user.firstName ?? ""} ${user.lastName ?? ""} <${email}> [${patientId}]`);

  const now = new Date().toISOString();

  // ── FHIR clinical records (upsert) ──
  const fhirRows = allFhir.map((r, i) => ({
    id: randomUUID(),
    patientId,
    source: FHIR_SOURCE,
    fileURL: "",
    fileType: "application/fhir+json",
    type: r.resourceType,
    time: r.effectiveDate,
    externalId: `mock-fhir:${r.recordType}:${i}`,
    dataBlob: encrypt(JSON.stringify({
      recordType: r.recordType,
      displayName: r.displayName,
      fhirRelease: "R4",
      fhirVersion: "4.0.1",
      sourceName: r.sourceName,
      fhirData: r.fhirData,
    })),
    // createdAt drives list ordering; use the clinical date so records sort
    // newest-first by when they happened.
    createdAt: r.effectiveDate,
    updatedAt: now,
  }));

  await db
    .insert(incomingFiles)
    .values(fhirRows)
    .onConflictDoUpdate({
      target: [incomingFiles.patientId, incomingFiles.source, incomingFiles.externalId],
      set: {
        dataBlob: sql`excluded."dataBlob"`,
        type: sql`excluded."type"`,
        time: sql`excluded."time"`,
        updatedAt: now,
      },
    });
  console.log(`✓ Upserted ${fhirRows.length} FHIR clinical records (1 lab panel of ${LABS.length} + ${otherRecords.length} others)`);

  // ── Uploaded documents (R2 + rows) — re-seed so updated mock content lands ──
  let uploaded = 0;
  for (const doc of DOCS) {
    const externalId = `mock-upload:${doc.slug}`;
    const existing = await db.query.incomingFiles.findFirst({
      where: and(
        eq(incomingFiles.patientId, patientId),
        eq(incomingFiles.source, UPLOAD_SOURCE),
        eq(incomingFiles.externalId, externalId),
      ),
    });
    if (existing) {
      // Remove the stale R2 object + row (fileUploadLog cascades) before
      // re-uploading the refreshed PDF, so re-runs replace rather than skip.
      if (existing.fileURL) await deleteFromR2(existing.fileURL).catch(() => {});
      await db.delete(incomingFiles).where(eq(incomingFiles.id, existing.id));
      console.log(`• Replacing existing "${doc.originalName}"`);
    }
    const pdf = buildPdf(doc.title, doc.lines);
    const fileURL = await uploadToR2(pdf, doc.originalName, "application/pdf");
    const id = randomUUID();
    await db.insert(incomingFiles).values({
      id,
      patientId,
      source: UPLOAD_SOURCE,
      fileURL,
      fileType: "pdf",
      externalId,
      createdAt: now,
    });
    await db.insert(fileUploadLog).values({
      id: randomUUID(),
      incomingFileId: id,
      uploadedById: patientId,
      originalName: doc.originalName,
    });
    uploaded++;
    console.log(`✓ Uploaded "${doc.originalName}" → ${fileURL}`);
  }

  // ── My Providers (userProviders) — insert by name; skip ones already present ──
  const existingProviders = await db.query.userProviders.findMany({
    where: eq(userProviders.userId, patientId),
  });
  const existingNames = new Set(existingProviders.map((p) => p.providerName));
  let nextOrder = existingProviders.length;
  let addedProviders = 0;
  for (const p of PROVIDERS) {
    if (existingNames.has(p.providerName)) {
      console.log(`• Provider "${p.providerName}" already present — skipping`);
      continue;
    }
    await db.insert(userProviders).values({
      id: randomUUID(),
      userId: patientId,
      order: nextOrder++,
      providerType: p.providerType,
      providerName: p.providerName,
      physicianName: p.physicianName ?? null,
      phone: p.phone ?? null,
      fax: p.fax ?? null,
      providerEmail: p.providerEmail ?? null,
      address: p.address ?? null,
    });
    addedProviders++;
    console.log(`✓ Added provider "${p.providerName}"`);
  }

  console.log(`\nDone. ${fhirRows.length} FHIR records + ${uploaded} document(s) + ${addedProviders} provider(s) for ${email}.`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
