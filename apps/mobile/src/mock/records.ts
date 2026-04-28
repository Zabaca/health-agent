export type RecordKind = "labs" | "imaging" | "notes";

export type RecordItem = {
  id: string;
  title: string;
  kind: RecordKind;
  date: string;
  provider: string;
  orderedBy: string;
  // Labs
  results?: { name: string; value: string; status: "Normal" | "High" | "Low" }[];
  // Imaging
  imageLabel?: string;
  findings?: string;
  impression?: string;
  // Notes
  chiefComplaint?: string;
  assessmentPlan?: string[];
};

export const mockRecords: RecordItem[] = [
  {
    id: "r1",
    title: "Comprehensive Metabolic Panel",
    kind: "labs",
    date: "Mar 28, 2026",
    provider: "Mass General Hospital",
    orderedBy: "Dr. Sarah Chen",
    results: [
      { name: "Glucose", value: "94 mg/dL", status: "Normal" },
      { name: "BUN", value: "18 mg/dL", status: "Normal" },
      { name: "Creatinine", value: "0.9 mg/dL", status: "Normal" },
      { name: "Sodium", value: "141 mEq/L", status: "Normal" },
      { name: "ALT", value: "52 U/L", status: "High" },
      { name: "AST", value: "24 U/L", status: "Normal" },
    ],
  },
  {
    id: "r2",
    title: "Chest X-Ray Report",
    kind: "imaging",
    date: "Feb 14, 2026",
    provider: "Mass General Hospital",
    orderedBy: "Dr. Sarah Chen",
    imageLabel: "Chest X-Ray · PA View",
    findings:
      "The lungs are clear and well expanded. No focal consolidation, pleural effusion, or pneumothorax is identified. The cardiac silhouette is within normal limits. The mediastinum is unremarkable. Bony thorax is intact.",
    impression: "No acute cardiopulmonary process. Normal chest radiograph.",
  },
  {
    id: "r3",
    title: "Primary Care Visit Notes",
    kind: "notes",
    date: "Jan 9, 2026",
    provider: "Mass General Hospital",
    orderedBy: "Dr. Sarah Chen · Primary Care",
    chiefComplaint:
      "Annual wellness exam. Patient reports mild fatigue over the past 3 weeks, no acute complaints.",
    assessmentPlan: [
      "Fatigue — order comprehensive metabolic panel and CBC to rule out anemia or thyroid dysfunction.",
      "Continue current medications. No changes at this time.",
      "Follow-up in 2 weeks to review lab results.",
    ],
  },
];

export const recordKindLabel: Record<RecordKind, string> = {
  labs: "Labs",
  imaging: "Imaging",
  notes: "Notes",
};

export const providerChips = ["Mass General Hospital", "Beth Israel Deaconess", "MGH Cardiology"];
