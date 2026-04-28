export type ReleaseStatus = "active" | "pending" | "expired";

export type Release = {
  id: string;
  provider: string;
  providerSubtitle?: string;
  representative: string; // or "Self-requested"
  code: string;
  status: ReleaseStatus;
  validUntil?: string;
  daysRemaining?: number;
  expiredOn?: string;
  recordsIncluded: string;
  requestType: string;
  createdOn: string;
};

export const mockReleases: Release[] = [
  {
    id: "rel1",
    provider: "Mass General Hospital",
    providerSubtitle: "General Hospital · Dept. of Health Records",
    representative: "Dr. Sarah Chen",
    code: "LMQ3X8K2",
    status: "active",
    validUntil: "Oct 15, 2026",
    daysRemaining: 90,
    recordsIncluded: "All records",
    requestType: "Full medical history",
    createdOn: "Jan 9, 2026",
  },
  {
    id: "rel2",
    provider: "Beth Israel Deaconess",
    representative: "Self-requested",
    code: "NP7QR2MX",
    status: "pending",
    validUntil: "Jul 15, 2026",
    daysRemaining: 90,
    recordsIncluded: "All records",
    requestType: "Full medical history",
    createdOn: "Apr 16, 2026",
  },
  {
    id: "rel3",
    provider: "MGH Cardiology",
    representative: "Dr. Sarah Chen",
    code: "K4ZTFB9W",
    status: "expired",
    expiredOn: "Jan 9, 2025",
    recordsIncluded: "All records",
    requestType: "Cardiology only",
    createdOn: "Oct 9, 2024",
  },
];

export const recordTypes = [
  "History & Physical",
  "Diagnostic Results",
  "Treatment / Procedure Notes",
  "Prescription / Medication",
  "Imaging / Radiology",
  "Discharge Summaries",
];

export const durationOptions = [
  { id: "30", value: 30, unit: "days" },
  { id: "90", value: 90, unit: "days" },
  { id: "1y", value: 1, unit: "year" },
  { id: "custom", value: 0, unit: "Custom" },
];
