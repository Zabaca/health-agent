import type { Permission } from "./agents";

export const mockPda = {
  id: "pda_sj",
  initials: "SJ",
  name: "Sarah Johnson",
  email: "sarah.johnson@email.com",
};

export type RepresentedPatient = {
  id: string;
  initials: string;
  name: string;
  dob: string;
  relationship: "Healthcare Proxy" | "Legal Guardian" | "Caregiver";
  status: "active" | "pending";
  startedOn: string;
  permissions: { records: Permission; providers: Permission; releases: Permission };
};

export const representedPatients: RepresentedPatient[] = [
  {
    id: "marcus",
    initials: "MJ",
    name: "Marcus Johnson",
    dob: "Jan 14, 1985",
    relationship: "Healthcare Proxy",
    status: "active",
    startedOn: "Jan 2024",
    permissions: { records: "editor", providers: "viewer", releases: "editor" },
  },
  {
    id: "margaret",
    initials: "MC",
    name: "Margaret Chen",
    dob: "Mar 4, 1948",
    relationship: "Healthcare Proxy",
    status: "active",
    startedOn: "Aug 2023",
    permissions: { records: "editor", providers: "editor", releases: "editor" },
  },
  {
    id: "james",
    initials: "JT",
    name: "James Truong",
    dob: "Jul 22, 2012",
    relationship: "Legal Guardian",
    status: "active",
    startedOn: "Sep 2022",
    permissions: { records: "editor", providers: "editor", releases: "viewer" },
  },
];

export const inviteFromPatient = {
  id: "marcus",
  initials: "MJ",
  name: "Marcus Johnson",
  relationship: "Patient Designated Agent" as const,
};

export function findPatient(id: string | null | undefined) {
  return representedPatients.find((p) => p.id === id) ?? representedPatients[0];
}
