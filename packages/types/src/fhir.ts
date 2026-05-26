/**
 * Resilient FHIR display helpers — shared by web + mobile.
 *
 * Apple HealthKit returns clinical records as FHIR in EITHER DSTU2 or R4, and
 * field shapes vary by release AND by source provider. So we never assume a
 * fixed schema: we read a small set of common fields defensively and fall back
 * to a raw key/value view for anything we don't model.
 *
 * TODO(fhir): add per-type polish (lab Observation reference-range/abnormal
 * flag, Medication dosage, Immunization vaccine code, Allergy reaction/severity)
 * and validate against real linked-provider data on a device before relying on
 * any type-specific rendering.
 */

/** Loosely-typed FHIR resource — real-world resources are highly variable. */
export type FhirResource = Record<string, unknown>;

/** The decrypted payload we persist in IncomingFile.dataBlob for healthkitFHIR rows. */
export interface StoredClinicalRecord {
  recordType: string;
  displayName: string | null;
  fhirRelease: string | null;
  fhirVersion: string | null;
  fhirData: FhirResource;
}

export interface FhirSummary {
  resourceType: string;
  title: string;
  status: string | null;
  date: string | null;
  /** Primary human-readable value, e.g. "5.6 %" for a lab Observation. */
  value: string | null;
  /** Best-effort labeled fields for display, beyond title/status/date/value. */
  fields: { label: string; value: string }[];
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}
function asString(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

/** Extract display text from a FHIR CodeableConcept (`code`) across releases. */
function codeText(code: unknown): string | null {
  const c = asRecord(code);
  if (!c) return null;
  const text = asString(c.text);
  if (text) return text;
  const coding = Array.isArray(c.coding) ? c.coding : [];
  for (const entry of coding) {
    const e = asRecord(entry);
    const display = e && asString(e.display);
    if (display) return display;
  }
  for (const entry of coding) {
    const e = asRecord(entry);
    const codeVal = e && asString(e.code);
    if (codeVal) return codeVal;
  }
  return null;
}

/** Status can be a plain string (DSTU2) or a CodeableConcept (R4 clinicalStatus). */
function readStatus(resource: Record<string, unknown>): string | null {
  return (
    asString(resource.status) ??
    codeText(resource.clinicalStatus) ??
    asString(resource.clinicalStatus) ??
    codeText(resource.verificationStatus) ??
    null
  );
}

/** First present clinical date across the common spellings/shapes. */
function readDate(resource: Record<string, unknown>): string | null {
  const direct =
    asString(resource.effectiveDateTime) ??
    asString(resource.onsetDateTime) ??
    asString(resource.recordedDate) ??
    asString(resource.dateRecorded) ??
    asString(resource.issued) ??
    asString(resource.occurrenceDateTime) ??
    asString(resource.authoredOn) ??
    asString(resource.date);
  if (direct) return direct;
  const period = asRecord(resource.effectivePeriod);
  if (period) return asString(period.start);
  return null;
}

/** Primary value: valueQuantity / valueString / valueCodeableConcept. */
function readValue(resource: Record<string, unknown>): string | null {
  const q = asRecord(resource.valueQuantity);
  if (q && typeof q.value === "number") {
    const unit = asString(q.unit) ?? asString(q.code) ?? "";
    return `${q.value}${unit ? ` ${unit}` : ""}`;
  }
  const s = asString(resource.valueString);
  if (s) return s;
  const cc = codeText(resource.valueCodeableConcept);
  if (cc) return cc;
  return null;
}

/**
 * Defensively summarize a FHIR resource into common display fields. Never
 * throws; missing fields are simply omitted.
 */
export function summarizeFhir(record: StoredClinicalRecord): FhirSummary {
  const resource = asRecord(record.fhirData) ?? {};
  const resourceType = asString(resource.resourceType) ?? record.recordType ?? "Unknown";
  const title =
    codeText(resource.code) ??
    codeText(resource.medicationCodeableConcept) ??
    codeText(resource.vaccineCode) ??
    asString(record.displayName) ??
    resourceType;

  const fields: { label: string; value: string }[] = [];
  const category = codeText(resource.category);
  if (category) fields.push({ label: "Category", value: category });
  if (record.fhirRelease) fields.push({ label: "FHIR", value: `${record.fhirRelease}${record.fhirVersion ? ` (${record.fhirVersion})` : ""}` });

  return {
    resourceType,
    title,
    status: readStatus(resource),
    date: readDate(resource),
    value: readValue(resource),
    fields,
  };
}
