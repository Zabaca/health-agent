import { notFound } from "next/navigation";
import InviteAcceptForm from "@/components/auth/InviteAcceptForm";

export const metadata = { title: "Accept Invitation" };

async function getInvite(token: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/invites/${token}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json() as Promise<{
    inviteId: string;
    inviteeEmail: string;
    patientName: string;
    relationship: string | null;
  }>;
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInvite(token);

  if (!invite) notFound();

  return <InviteAcceptForm token={token} invite={invite} />;
}
