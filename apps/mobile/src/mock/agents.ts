export type Permission = "none" | "viewer" | "editor";

export type DesignatedAgent = {
  id: string;
  initials: string;
  name: string;
  role: string;
  email?: string;
  status: "active" | "pending";
  invitedOn: string;
  expiresIn?: string;
  permissions: { records: Permission; providers: Permission; releases: Permission };
};

export const mockAgents: DesignatedAgent[] = [
  {
    id: "a1",
    initials: "SC",
    name: "Dr. Sarah Chen",
    role: "Primary Care Physician",
    email: "sarah.chen@example.com",
    status: "active",
    invitedOn: "Jan 15, 2026",
    permissions: { records: "editor", providers: "viewer", releases: "editor" },
  },
  {
    id: "a2",
    initials: "MJ",
    name: "Dr. Marcus Johnson",
    role: "Cardiologist",
    email: "marcus.johnson@example.com",
    status: "pending",
    invitedOn: "Mar 1, 2026",
    expiresIn: "Expires in 7 days",
    permissions: { records: "viewer", providers: "none", releases: "viewer" },
  },
  {
    id: "a3",
    initials: "SJ",
    name: "Sarah Johnson",
    role: "Healthcare Proxy",
    email: "sarah.johnson@email.com",
    status: "active",
    invitedOn: "Apr 3, 2026",
    permissions: { records: "editor", providers: "editor", releases: "editor" },
  },
];
