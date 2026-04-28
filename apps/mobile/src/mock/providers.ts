export type Provider = {
  id: string;
  organization: string;
  type: "Hospital / Facility" | "Insurance" | "Clinic";
  physician?: string;
  specialty?: string;
  phone?: string;
  fax?: string;
  address?: string;
  patientId?: string;
  memberNumber?: string;
};

export const mockProviders: Provider[] = [
  {
    id: "pr1",
    organization: "Mass General Hospital",
    type: "Hospital / Facility",
    physician: "Dr. Sarah Chen",
    specialty: "Primary Care",
    phone: "(617) 555-0100",
    fax: "(617) 555-0101",
    address: "123 Main St, Boston, MA 02114",
    patientId: "MGH-2024-001",
  },
  {
    id: "pr2",
    organization: "Boston Medical Center",
    type: "Hospital / Facility",
    physician: "Dr. Marcus Johnson",
    specialty: "Cardiology",
  },
  {
    id: "pr3",
    organization: "Blue Cross Blue Shield",
    type: "Insurance",
    memberNumber: "BC-4829",
  },
];

export const insuranceMemberLine = (p: Provider) =>
  p.type === "Insurance"
    ? `Insurance · Member #${p.memberNumber}`
    : p.specialty
      ? `${p.specialty} · ${p.organization}`
      : `${p.type === "Hospital / Facility" ? "Hospital" : "Facility"} · ${p.physician}`;
