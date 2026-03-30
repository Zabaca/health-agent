import { notFound } from "next/navigation";
import InviteAcceptForm from "@/components/auth/InviteAcceptForm";
import { db } from "@/lib/db";
import { patientDesignatedAgents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const metadata = { title: "Accept Invitation" };

async function getInvite(token: string) {
  const invite = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.token, token),
      eq(patientDesignatedAgents.status, 'pending')
    ),
    with: { patient: true },
  });

  if (!invite) return null;
  if (invite.tokenExpiresAt && new Date(invite.tokenExpiresAt) < new Date()) return null;

  const patientName = [invite.patient?.firstName, invite.patient?.lastName].filter(Boolean).join(' ') || invite.patient?.email || 'Patient';

  return {
    inviteId: invite.id,
    inviteeEmail: invite.inviteeEmail,
    patientName,
    relationship: invite.relationship,
  };
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
